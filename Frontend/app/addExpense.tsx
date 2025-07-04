import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Animated,
  StyleSheet,
  StatusBar,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  FlatList,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const AddExpense = () => {
  const router = useRouter();
  const { groupId, groupName } = useLocalSearchParams();

  const [expenseData, setExpenseData] = useState({
    amount: "",
    description: "",
    category: "general",
    date: new Date().toISOString().split('T')[0],
    paidBy: null,
    splitType: "equal", // equal, manual, percentage
    splitDetails: {},
  });

  const [members, setMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const headerSlide = useRef(new Animated.Value(-50)).current;
  const formScale = useRef(new Animated.Value(0.95)).current;

  const categories = [
    { id: "food", name: "Food & Dining", icon: "restaurant", color: "#F59E0B" },
    { id: "transport", name: "Transportation", icon: "car", color: "#3B82F6" },
    { id: "entertainment", name: "Entertainment", icon: "game-controller", color: "#8B5CF6" },
    { id: "shopping", name: "Shopping", icon: "bag", color: "#EC4899" },
    { id: "utilities", name: "Utilities", icon: "flash", color: "#10B981" },
    { id: "health", name: "Health & Medical", icon: "medical", color: "#EF4444" },
    { id: "general", name: "General", icon: "card", color: "#6B7280" },
  ];

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8082/api/v1/group/members/${groupId}`
        );
        setMembers(res.data || []);
        // Set current user as default payer (assuming user ID 1)
        const currentUser = res.data.find(member => member.id === 1);
        if (currentUser) {
          setExpenseData(prev => ({ ...prev, paidBy: currentUser }));
        }
        // Select all members by default for equal split
        setSelectedMembers(res.data || []);
      } catch (error) {
        console.error("Failed to fetch members", error);
        Alert.alert("Error", "Could not fetch group members");
      }
    };

    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(headerSlide, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(formScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();

    fetchMembers();
  }, []);

  const selectedCategory = categories.find(cat => cat.id === expenseData.category);

  const handleSubmit = async () => {
    // Validation
    if (!expenseData.amount.trim()) {
      Alert.alert("Error", "Please enter an amount");
      return;
    }
    if (!expenseData.description.trim()) {
      Alert.alert("Error", "Please enter a description");
      return;
    }
    if (!expenseData.paidBy) {
      Alert.alert("Error", "Please select who paid");
      return;
    }
    if (selectedMembers.length === 0) {
      Alert.alert("Error", "Please select at least one member to split with");
      return;
    }

    setLoading(true);
    try {
      const expensePayload = {
        groupId: parseInt(groupId),
        amount: parseFloat(expenseData.amount),
        description: expenseData.description,
        category: expenseData.category,
        date: expenseData.date,
        paidBy: expenseData.paidBy.id,
        splitWith: selectedMembers.map(member => member.id),
        splitType: expenseData.splitType,
        splitDetails: expenseData.splitDetails,
      };

      const res = await axios.post(
        "http://localhost:8082/api/v1/expenses/create",
        expensePayload
      );

      Alert.alert(
        "Success", 
        "Expense added successfully!",
        [
          {
            text: "OK",
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      console.error("Error creating expense:", error);
      Alert.alert("Error", "Failed to add expense. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderCategoryModal = () => (
    <Modal
      visible={showCategoryModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowCategoryModal(false)}
    >
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.modalContent, { transform: [{ scale: formScale }] }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Category</Text>
            <TouchableOpacity
              onPress={() => setShowCategoryModal(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={categories}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.categoryItem,
                  expenseData.category === item.id && styles.categoryItemSelected
                ]}
                onPress={() => {
                  setExpenseData(prev => ({ ...prev, category: item.id }));
                  setShowCategoryModal(false);
                }}
              >
                <View style={[styles.categoryIcon, { backgroundColor: `${item.color}20` }]}>
                  <Ionicons name={item.icon} size={24} color={item.color} />
                </View>
                <Text style={styles.categoryName}>{item.name}</Text>
                {expenseData.category === item.id && (
                  <Ionicons name="checkmark" size={24} color="#10B981" />
                )}
              </TouchableOpacity>
            )}
          />
        </Animated.View>
      </View>
    </Modal>
  );

  const renderMemberModal = () => (
    <Modal
      visible={showMemberModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowMemberModal(false)}
    >
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.modalContent, { transform: [{ scale: formScale }] }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Who Paid?</Text>
            <TouchableOpacity
              onPress={() => setShowMemberModal(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={members}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.memberItem,
                  expenseData.paidBy?.id === item.id && styles.memberItemSelected
                ]}
                onPress={() => {
                  setExpenseData(prev => ({ ...prev, paidBy: item }));
                  setShowMemberModal(false);
                }}
              >
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberInitial}>
                    {item.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.memberName}>{item.name}</Text>
                {expenseData.paidBy?.id === item.id && (
                  <Ionicons name="checkmark" size={24} color="#10B981" />
                )}
              </TouchableOpacity>
            )}
          />
        </Animated.View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />
      
      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: headerSlide }],
          },
        ]}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Add Expense</Text>
          <Text style={styles.headerSubtitle}>{groupName}</Text>
        </View>
        <View style={styles.headerRight} />
      </Animated.View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Amount Input */}
        <Animated.View
          style={[
            styles.amountCard,
            {
              opacity: fadeAnim,
              transform: [{ scale: formScale }],
            },
          ]}
        >
          <LinearGradient
            colors={["#8B5CF615", "#7C3AED10"]}
            style={styles.amountGradient}
          >
            <Text style={styles.amountLabel}>Amount</Text>
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor="#9CA3AF"
                value={expenseData.amount}
                onChangeText={(text) => 
                  setExpenseData(prev => ({ ...prev, amount: text }))
                }
                keyboardType="numeric"
                autoFocus
              />
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Form Fields */}
        <Animated.View
          style={[
            styles.formCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Description */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={styles.textInput}
              placeholder="What was this expense for?"
              placeholderTextColor="#9CA3AF"
              value={expenseData.description}
              onChangeText={(text) => 
                setExpenseData(prev => ({ ...prev, description: text }))
              }
            />
          </View>

          {/* Category */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Category</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowCategoryModal(true)}
            >
              <View style={styles.selectContent}>
                <View style={[styles.categoryIcon, { backgroundColor: `${selectedCategory.color}20` }]}>
                  <Ionicons name={selectedCategory.icon} size={20} color={selectedCategory.color} />
                </View>
                <Text style={styles.selectText}>{selectedCategory.name}</Text>
              </View>
              <Ionicons name="chevron-down" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Date */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Date</Text>
            <TextInput
              style={styles.textInput}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9CA3AF"
              value={expenseData.date}
              onChangeText={(text) => 
                setExpenseData(prev => ({ ...prev, date: text }))
              }
            />
          </View>

          {/* Who Paid */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Who Paid?</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowMemberModal(true)}
            >
              <View style={styles.selectContent}>
                {expenseData.paidBy ? (
                  <>
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberInitial}>
                        {expenseData.paidBy.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.selectText}>{expenseData.paidBy.name}</Text>
                  </>
                ) : (
                  <Text style={[styles.selectText, { color: "#9CA3AF" }]}>
                    Select who paid
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-down" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Split Info */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Split Between</Text>
            <View style={styles.splitInfo}>
              <Text style={styles.splitText}>
                {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} • 
                ${expenseData.amount ? (parseFloat(expenseData.amount) / selectedMembers.length).toFixed(2) : '0.00'} each
              </Text>
              <TouchableOpacity style={styles.splitButton}>
                <Text style={styles.splitButtonText}>Equal Split</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Submit Button */}
        <Animated.View
          style={[
            styles.submitContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={loading}
          >
            <LinearGradient
              colors={["#8B5CF6", "#7C3AED"]}
              style={styles.submitGradient}
            >
              {loading ? (
                <Text style={styles.submitText}>Adding Expense...</Text>
              ) : (
                <>
                  <Ionicons name="add" size={24} color="white" />
                  <Text style={styles.submitText}>Add Expense</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {renderCategoryModal()}
      {renderMemberModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  amountCard: {
    margin: 20,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  amountGradient: {
    padding: 32,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },
  amountLabel: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 16,
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  currencySymbol: {
    fontSize: 48,
    fontWeight: "300",
    color: "#8B5CF6",
    marginRight: 8,
  },
  amountInput: {
    fontSize: 48,
    fontWeight: "300",
    color: "#111827",
    minWidth: 120,
    textAlign: "left",
  },
  formCard: {
    margin: 20,
    marginTop: 0,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111827",
    backgroundColor: "#F9FAFB",
  },
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F9FAFB",
  },
  selectContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  selectText: {
    fontSize: 16,
    color: "#111827",
    marginLeft: 12,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  splitInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  splitText: {
    fontSize: 14,
    color: "#6B7280",
  },
  splitButton: {
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  splitButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "white",
  },
  submitContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  submitButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  submitGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  submitText: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  categoryItemSelected: {
    backgroundColor: "#F0FDF4",
  },
  categoryName: {
    fontSize: 16,
    color: "#111827",
    marginLeft: 12,
    flex: 1,
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  memberItemSelected: {
    backgroundColor: "#F0FDF4",
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#8B5CF6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  memberInitial: {
    fontSize: 14,
    fontWeight: "700",
    color: "white",
  },
  memberName: {
    fontSize: 16,
    color: "#111827",
    flex: 1,
  },
});

export default AddExpense;