import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../../auth/firebase";

const { width: screenWidth } = Dimensions.get("window");

export default function AddTransactions() {
  const router = useRouter();
  const { groupId, groupName, type = "expense" } = useLocalSearchParams();

  const [transactionType, setTransactionType] = useState(type); // 'expense' or 'income'
  const [transactionData, setTransactionData] = useState({
    amount: "",
    description: "",
    category: "general",
  });

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [idToken, setIdToken] = useState("");

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const headerSlide = useRef(new Animated.Value(-50)).current;
  const formScale = useRef(new Animated.Value(0.95)).current;
  const toggleSlide = useRef(new Animated.Value(0)).current;

  const expenseCategories = [
    { id: "Food", name: "Food & Dining", icon: "restaurant", color: "#F59E0B" },
    { id: "transport", name: "Transportation", icon: "car", color: "#3B82F6" },
    {
      id: "Entertainment",
      name: "Entertainment",
      icon: "game-controller",
      color: "#8B5CF6",
    },
    { id: "Shopping", name: "Shopping", icon: "bag", color: "#EC4899" },
    { id: "utilities", name: "Utilities", icon: "flash", color: "#10B981" },
    {
      id: "Health",
      name: "Health & Medical",
      icon: "medical",
      color: "#EF4444",
    },
    { id: "General", name: "General", icon: "card", color: "#6B7280" },
  ];

  const incomeCategories = [
    { id: "Salary", name: "Salary", icon: "briefcase", color: "#10B981" },
    { id: "Freelance", name: "Freelance", icon: "laptop", color: "#3B82F6" },
    {
      id: "Investment",
      name: "Investment",
      icon: "trending-up",
      color: "#8B5CF6",
    },
    { id: "Gift", name: "Gift", icon: "gift", color: "#EC4899" },
    { id: "Refund", name: "Refund", icon: "refresh", color: "#F59E0B" },
    { id: "Bonus", name: "Bonus", icon: "star", color: "#EF4444" },
    { id: "Other", name: "Other Income", icon: "cash", color: "#6B7280" },
  ];

  const categories =
    transactionType === "expense" ? expenseCategories : incomeCategories;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser?.getIdToken();
          setIdToken(idToken);
        } catch (error) {
          console.error("Error getting ID token:", error);
        }
      }
    });
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

    return () => unsubscribe();
  }, [transactionType]);

  const handleTypeToggle = (
    newType: React.SetStateAction<string | string[]>
  ) => {
    if (newType === transactionType) return;

    Animated.timing(toggleSlide, {
      toValue: newType === "expense" ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    setTransactionType(newType);
    setTransactionData((prev) => ({
      ...prev,
      category: newType === "expense" ? "general" : "salary",
    }));
  };

  const selectedCategory = categories.find(
    (cat) => cat.id === transactionData.category
  );

  const handleSubmit = async () => {
    // Validation
    if (!transactionData.amount.trim()) {
      Alert.alert("Error", "Please enter an amount");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        amount: parseFloat(transactionData.amount),
        description: transactionData.description.trim() ? transactionData.description : "No description",
        category: transactionData.category,
      };

      const endpoint =
        transactionType === "expense"
          ? `${Constants.expoConfig?.extra?.Basic_URL}/api/v1/expense/add`
          : `${Constants.expoConfig?.extra?.Basic_URL}/api/v1/income/add`;

      const res = await axios.post(endpoint, payload, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      Alert.alert(
        "Success",
        `${transactionType === "expense" ? "Expense" : "Income"} added successfully!`,
        [
          {
            text: "OK",
            onPress: () => router.replace("/(tabs)/dashboard"),
          },
        ]
      );
    } catch (error) {
      console.error(`Error creating ${transactionType}:`, error);
      Alert.alert(
        "Error",
        `Failed to add ${transactionType}. Please try again.`
      );
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
        <Animated.View
          style={[styles.modalContent, { transform: [{ scale: formScale }] }]}
        >
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
                  transactionData.category === item.id &&
                    styles.categoryItemSelected,
                ]}
                onPress={() => {
                  setTransactionData((prev) => ({
                    ...prev,
                    category: item.id,
                  }));
                  setShowCategoryModal(false);
                }}
              >
                <View
                  style={[
                    styles.categoryIcon,
                    { backgroundColor: `${item.color}20` },
                  ]}
                >
                  <Ionicons name={item.icon as any} size={24} color={item.color} />
                </View>
                <Text style={styles.categoryName}>{item.name}</Text>
                {transactionData.category === item.id && (
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
        <Animated.View
          style={[styles.modalContent, { transform: [{ scale: formScale }] }]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {transactionType === "expense" ? "Who Paid?" : "Who Received?"}
            </Text>
            <TouchableOpacity
              onPress={() => setShowMemberModal(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );

  const getAmountColor = () => {
    return transactionType === "expense" ? "#EF4444" : "#10B981";
  };

  const getAmountPrefix = () => {
    return transactionType === "expense" ? "-₹" : "+₹";
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
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
          <Text style={styles.headerTitle}>
            Add {transactionType === "expense" ? "Expense" : "Income"}
          </Text>
          <Text style={styles.headerSubtitle}>{groupName}</Text>
        </View>
        <View style={styles.headerRight} />
      </Animated.View>

      {/* Type Toggle */}
      <Animated.View
        style={[
          styles.toggleContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.toggleWrapper}>
          <Animated.View
            style={[
              styles.toggleSlider,
              {
                transform: [
                  {
                    translateX: toggleSlide.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, (screenWidth - 80) / 2],
                    }),
                  },
                ],
              },
            ]}
          />
          <TouchableOpacity
            style={[
              styles.toggleButton,
              transactionType === "expense" && styles.toggleButtonActive,
            ]}
            onPress={() => handleTypeToggle("expense")}
          >
            <Ionicons
              name="remove-circle"
              size={20}
              color={transactionType === "expense" ? "white" : "#EF4444"}
            />
            <Text
              style={[
                styles.toggleText,
                transactionType === "expense" && styles.toggleTextActive,
              ]}
            >
              Expense
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              transactionType === "income" && styles.toggleButtonActive,
            ]}
            onPress={() => handleTypeToggle("income")}
          >
            <Ionicons
              name="add-circle"
              size={20}
              color={transactionType === "income" ? "white" : "#10B981"}
            />
            <Text
              style={[
                styles.toggleText,
                transactionType === "income" && styles.toggleTextActive,
              ]}
            >
              Income
            </Text>
          </TouchableOpacity>
        </View>
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
            colors={
              transactionType === "expense"
                ? ["#EF444415", "#DC262610"]
                : ["#10B98115", "#059F6910"]
            }
            style={styles.amountGradient}
          >
            <Text style={styles.amountLabel}>Amount</Text>
            <View style={styles.amountInputContainer}>
              <Text
                style={[styles.currencySymbol, { color: getAmountColor() }]}
              >
                {getAmountPrefix()}
              </Text>
              <TextInput
                style={[styles.amountInput, { color: getAmountColor() }]}
                placeholder="0.00"
                placeholderTextColor="#9CA3AF"
                value={transactionData.amount}
                onChangeText={(text) =>
                  setTransactionData((prev) => ({ ...prev, amount: text }))
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
          {/* Category */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Category</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowCategoryModal(true)}
            >
              <View style={styles.selectContent}>
                <View
                  style={[
                    styles.categoryIcon,
                    { backgroundColor: selectedCategory?.color + "20" }, // ✅ corrected string concat
                  ]}
                >
                  <Ionicons
                    name={selectedCategory?.icon as any}
                    size={20}
                    color={selectedCategory?.color}
                  />
                </View>
                <Text style={styles.selectText}>{selectedCategory?.name}</Text>
              </View>
              <Ionicons name="chevron-down" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Description */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={styles.textInput}
              placeholder={`What was this ${transactionType} for?`}
              placeholderTextColor="#9CA3AF"
              value={transactionData.description}
              onChangeText={(text) =>
                setTransactionData((prev) => ({ ...prev, description: text }))
              }
            />
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
              colors={
                transactionType === "expense"
                  ? ["#EF4444", "#DC2626"]
                  : ["#10B981", "#059F69"]
              }
              style={styles.submitGradient}
            >
              {loading ? (
                <Text style={styles.submitText}>
                  Adding {transactionType === "expense" ? "Expense" : "Income"}
                  ...
                </Text>
              ) : (
                <>
                  <Ionicons
                    name={transactionType === "expense" ? "remove" : "add"}
                    size={24}
                    color="white"
                  />
                  <Text style={styles.submitText}>
                    Add {transactionType === "expense" ? "Expense" : "Income"}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {renderCategoryModal()}
      {renderMemberModal()}
    </KeyboardAvoidingView>
  );
}

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
  toggleContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
  },
  toggleWrapper: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 4,
    position: "relative",
  },
  toggleSlider: {
    position: "absolute",
    top: 4,
    left: 4,
    right: 4,
    height: 40,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    width: (screenWidth - 80) / 2,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  toggleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    zIndex: 1,
  },
  toggleButtonActive: {
    // Active styles handled by slider background
  },
  toggleText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
    marginLeft: 8,
  },
  toggleTextActive: {
    color: "#111827",
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
    marginRight: 8,
  },
  amountInput: {
    fontSize: 48,
    fontWeight: "300",
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
