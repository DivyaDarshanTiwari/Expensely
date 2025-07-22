import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../auth/firebase";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface Member {
  id: number;
  username: string;
}

const EditExpense = () => {
  const router = useRouter();
  const { groupId, groupName, groupData, expenseId } = useLocalSearchParams();

  const [expenseData, setExpenseData] = useState({
    amount: "",
    description: "",
    category: "general",
    paidBy: "",
    splitAmong: [] as Member[],
  });
  const [members, setMembers] = useState<Member[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSplitMemberModal, setShowSplitMemberModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [idToken, setIdToken] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const headerSlide = useRef(new Animated.Value(-50)).current;
  const formScale = useRef(new Animated.Value(0.95)).current;

  const categories = [
    { id: "food", name: "Food & Dining", icon: "restaurant", color: "#F59E0B" },
    { id: "transport", name: "Transportation", icon: "car", color: "#3B82F6" },
    {
      id: "entertainment",
      name: "Entertainment",
      icon: "game-controller",
      color: "#8B5CF6",
    },
    { id: "shopping", name: "Shopping", icon: "bag", color: "#EC4899" },
    { id: "utilities", name: "Utilities", icon: "flash", color: "#10B981" },
    {
      id: "health",
      name: "Health & Medical",
      icon: "medical",
      color: "#EF4444",
    },
    { id: "general", name: "General", icon: "card", color: "#6B7280" },
  ];

  useEffect(() => {
    const fetchMembers = async (token: string) => {
      try {
        const res = await axios.get(
          `${Constants.expoConfig?.extra?.Group_URL}/api/v1/group/getMembers/${groupId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setMembers(res.data || []);
      } catch (error) {
        Alert.alert("Error", "Could not fetch group members");
      }
    };

    const fetchExpense = async (token: string) => {
      try {
        const res = await axios.get(
          `${Constants.expoConfig?.extra?.Group_URL}/api/v1/groupExpense/getExpense/${expenseId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = res.data;
        setExpenseData({
          amount: String(data.amount),
          description: data.description,
          category: data.category,
          paidBy: data.paidBy,
          splitAmong:
            data.shares?.map((s: any) => ({ username: s.username, id: 0 })) ||
            [],
        });
      } catch (error) {
        Alert.alert("Error", "Could not fetch expense details");
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setCurrentUser(firebaseUser);
        try {
          const token = await firebaseUser.getIdToken();
          setIdToken(token);
          await fetchMembers(token);
          await fetchExpense(token);
        } catch (error) {
          Alert.alert("Error", "Authentication failed");
        }
      } else {
        Alert.alert("Error", "Please log in to continue");
        router.back();
      }
    });

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
  }, [groupId, expenseId]);

  const selectedCategory =
    categories.find((cat) => cat.id === expenseData.category) ||
    categories[categories.length - 1];

  const validateForm = (): boolean => {
    if (
      !expenseData.amount.trim() ||
      Number.parseFloat(expenseData.amount) <= 0
    ) {
      Alert.alert("Error", "Please enter a valid amount");
      return false;
    }
    if (!expenseData.description.trim()) {
      Alert.alert("Error", "Please enter a description");
      return false;
    }
    if (!expenseData.paidBy) {
      Alert.alert("Error", "Paid by info missing");
      return false;
    }
    if (expenseData.splitAmong.length === 0) {
      Alert.alert("Error", "Please select members to split the expense among");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const payload = {
        userId: currentUser?.uid, // Backend expects userId
        amount: Number.parseFloat(expenseData.amount),
        category: expenseData.category,
        description: expenseData.description,
        shares: expenseData.splitAmong.map((member) => ({
          username: member.username,
          amountOwned:
            Number.parseFloat(expenseData.amount) /
            expenseData.splitAmong.length,
        })),
      };
      await axios.put(
        `${Constants.expoConfig?.extra?.Group_URL}/api/v1/groupExpense/edit/${groupId}/${expenseId}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );
      Alert.alert("Success", "Expense updated successfully!", [
        {
          text: "OK",
          onPress: () =>
            router.push({
              pathname: "/groupDetails",
              params: {
                groupId: groupId,
                groupName: groupName,
                groupData: groupData,
                refresh: "true",
              },
            }),
        },
      ]);
    } catch (err: any) {
      Alert.alert(
        "Error",
        err?.response?.data?.message ||
          "Failed to update expense. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const renderSplitMemberModal = () => (
    <Modal
      visible={showSplitMemberModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowSplitMemberModal(false)}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[styles.modalContent, { transform: [{ scale: formScale }] }]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Split Among</Text>
            <TouchableOpacity
              onPress={() => setShowSplitMemberModal(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          {/* All Members Option */}
          <TouchableOpacity
            style={[
              styles.memberItem,
              expenseData.splitAmong.length === members.length &&
                styles.memberItemSelected,
            ]}
            onPress={() => {
              setExpenseData((prev) => ({ ...prev, splitAmong: members }));
            }}
          >
            <View style={[styles.memberAvatar, { backgroundColor: "#10B981" }]}>
              <Ionicons name="people" size={16} color="white" />
            </View>
            <Text style={styles.memberName}>All Members</Text>
            {expenseData.splitAmong.length === members.length && (
              <Ionicons name="checkmark" size={24} color="#10B981" />
            )}
          </TouchableOpacity>
          <FlatList
            data={members}
            keyExtractor={(item) => item.username}
            renderItem={({ item }) => {
              const isSelected = expenseData.splitAmong.some(
                (member) => member.username === item.username
              );
              return (
                <TouchableOpacity
                  style={[
                    styles.memberItem,
                    isSelected && styles.memberItemSelected,
                  ]}
                  onPress={() => {
                    setExpenseData((prev) => ({
                      ...prev,
                      splitAmong: isSelected
                        ? prev.splitAmong.filter(
                            (member) => member.username !== item.username
                          )
                        : [...prev.splitAmong, item],
                    }));
                  }}
                >
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberInitial}>
                      {(item.username.charAt(0) || "?").toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.memberName}>{item.username}</Text>
                  {isSelected && (
                    <Ionicons name="checkmark" size={24} color="#10B981" />
                  )}
                </TouchableOpacity>
              );
            }}
          />
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalDoneButton}
              onPress={() => setShowSplitMemberModal(false)}
            >
              <Text style={styles.modalDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
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
          <Text style={styles.headerTitle}>Edit Expense</Text>
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
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor="#9CA3AF"
                value={expenseData.amount}
                onChangeText={(text) =>
                  setExpenseData((prev) => ({ ...prev, amount: text }))
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
                setExpenseData((prev) => ({ ...prev, description: text }))
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
                <View
                  style={[
                    styles.categoryIcon,
                    { backgroundColor: `${selectedCategory.color}20` },
                  ]}
                >
                  <Ionicons
                    name={selectedCategory.icon as any}
                    size={20}
                    color={selectedCategory.color}
                  />
                </View>
                <Text style={styles.selectText}>{selectedCategory.name}</Text>
              </View>
              <Ionicons name="chevron-down" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
          {/* Who Paid (read-only) */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Paid By</Text>
            <View style={styles.selectButton}>
              <Text style={styles.selectText}>{expenseData.paidBy}</Text>
            </View>
          </View>
          {/* Split Among */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Split Among</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowSplitMemberModal(true)}
            >
              <View style={styles.selectContent}>
                {expenseData.splitAmong.length > 0 ? (
                  <Text style={styles.selectText}>
                    {expenseData.splitAmong.length} member
                    {expenseData.splitAmong.length !== 1 ? "s" : ""} • ₹
                    {expenseData.amount
                      ? (
                          Number.parseFloat(expenseData.amount) /
                          expenseData.splitAmong.length
                        ).toFixed(2)
                      : "0.00"}{" "}
                    each
                  </Text>
                ) : (
                  <Text style={[styles.selectText, { color: "#9CA3AF" }]}>
                    Select members to split among
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-down" size={20} color="#6B7280" />
            </TouchableOpacity>
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
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <LinearGradient
              colors={loading ? ["#9CA3AF", "#6B7280"] : ["#8B5CF6", "#7C3AED"]}
              style={styles.submitGradient}
            >
              {loading ? (
                <Text style={styles.submitText}>Updating...</Text>
              ) : (
                <>
                  <Ionicons name="save" size={24} color="white" />
                  <Text style={styles.submitText}>Update Expense</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
      {/* Modals */}
      {/* Category Modal */}
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
                    expenseData.category === item.id &&
                      styles.categoryItemSelected,
                  ]}
                  onPress={() => {
                    setExpenseData((prev) => ({ ...prev, category: item.id }));
                    setShowCategoryModal(false);
                  }}
                >
                  <View
                    style={[
                      styles.categoryIcon,
                      { backgroundColor: `${item.color}20` },
                    ]}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={24}
                      color={item.color}
                    />
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
      {renderSplitMemberModal()}
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
  submitContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  submitButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  submitButtonDisabled: {
    opacity: 0.7,
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
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  modalDoneButton: {
    backgroundColor: "#8B5CF6",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
  },
  modalDoneText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
});

export default EditExpense;
