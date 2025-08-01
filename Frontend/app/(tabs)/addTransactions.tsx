"use client";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { getStoredToken, getStoredUserId } from "../../utils/storage";
import { refreshInvalidToken } from "@/utils/refreshIfInvalid";
import { styles } from "@/components/AddTransactions/styles/styles";
import TypeToggle from "@/components/AddTransactions/typeToggle";
import CategoryModal from "@/components/AddTransactions/CategoryModal";
import AddCategoryModal from "@/components/AddTransactions/AddCategoryModel";

export default function AddTransactions() {
  const router = useRouter();
  const { groupId, groupName, type = "expense" } = useLocalSearchParams();
  const [transactionType, setTransactionType] = useState(type);
  const [transactionData, setTransactionData] = useState({
    amount: "",
    description: "",
    category: "general",
  });
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [idToken, setIdToken] = useState("");
  const [userId, setUserId] = useState("");

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const headerSlide = useRef(new Animated.Value(-50)).current;
  const formScale = useRef(new Animated.Value(0.95)).current;
  const toggleSlide = useRef(new Animated.Value(0)).current;

  type Category = {
    id: string;
    name: string;
    icon: string;
    color: string;
    type?: string;
  };

  const expenseCategories: Category[] = [
    { id: "Food", name: "Food & Dining", icon: "restaurant", color: "#F59E0B" },
    {
      id: "Transport",
      name: "Transport & Travel",
      icon: "car",
      color: "#3B82F6",
    },
    {
      id: "Accommodation",
      name: "Accommodation",
      icon: "bed",
      color: "#7C3AED",
    },
    {
      id: "Entertainment",
      name: "Entertainment",
      icon: "game-controller",
      color: "#8B5CF6",
    },
    { id: "Shopping", name: "Shopping", icon: "bag", color: "#EC4899" },
    { id: "Grocery", name: "Grocery", icon: "cart", color: "#22D3EE" },
    { id: "Utilities", name: "Utilities", icon: "flash", color: "#10B981" },
    {
      id: "Health",
      name: "Health & Medical",
      icon: "medical",
      color: "#EF4444",
    },
    { id: "General", name: "General", icon: "card", color: "#6B7280" },
  ];

  const incomeCategories: Category[] = [
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

  // Personal Category State
  type PersonalCategory = {
    categoryId?: string;
    id?: string;
    name: string;
    [key: string]: any;
  };
  const [personalCategories, setPersonalCategories] = useState<
    PersonalCategory[]
  >([]);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);

  // Keyword mapping for auto-category detection
  const keywordCategoryMapExpense = [
    { keywords: ["petrol", "fuel", "gas"], categoryId: "Transport" },
    {
      keywords: ["hotel", "stay", "accommodation"],
      categoryId: "Accommodation",
    },
    {
      keywords: ["flight", "air", "train", "bus", "taxi"],
      categoryId: "Transport",
    },
    {
      keywords: ["food", "dinner", "lunch", "breakfast", "snack", "restaurant"],
      categoryId: "Food",
    },
    {
      keywords: ["ticket", "activity", "museum", "zoo", "park"],
      categoryId: "Entertainment",
    },
    {
      keywords: ["shopping", "mall", "clothes", "gift"],
      categoryId: "Shopping",
    },
    {
      keywords: ["medicine", "doctor", "pharmacy", "health"],
      categoryId: "Health",
    },
    {
      keywords: ["utility", "electricity", "water", "wifi", "internet"],
      categoryId: "Utilities",
    },
    {
      keywords: ["grocery", "groceries", "supermarket", "vegetable", "fruit"],
      categoryId: "Grocery",
    },
  ];

  const keywordCategoryMapIncome = [
    {
      keywords: ["salary", "payroll", "paycheck", "pocket money"],
      categoryId: "Salary",
    },
    { keywords: ["freelance", "contract", "project"], categoryId: "Freelance" },
    {
      keywords: ["investment", "dividend", "interest", "stock", "mutual fund"],
      categoryId: "Investment",
    },
    { keywords: ["gift", "present"], categoryId: "Gift" },
    { keywords: ["refund", "return"], categoryId: "Refund" },
    { keywords: ["bonus", "incentive", "award"], categoryId: "Bonus" },
    { keywords: ["other", "misc"], categoryId: "Other" },
  ];

  function detectCategory(description: string, type: string) {
    const desc = description.toLowerCase();
    const map =
      type === "income" ? keywordCategoryMapIncome : keywordCategoryMapExpense;
    for (const entry of map) {
      if (entry.keywords.some((kw) => desc.includes(kw))) {
        return entry.categoryId;
      }
    }
    if (type === "income") return incomeCategories[0].id;
    if (type === "expense") return expenseCategories[0].id;
    return null;
  }

  useEffect(() => {
    // Get both idToken and userId using SecureStore helpers from utils/storage.ts
    const initializeAuth = async () => {
      try {
        const token = await getStoredToken();
        const userIdFromStorage = await getStoredUserId();

        if (token) {
          setIdToken(token);
        } else {
          console.warn("No idToken found in storage");
        }

        if (userIdFromStorage) {
          setUserId(userIdFromStorage);
        } else {
          console.warn("No userId found in storage");
        }
      } catch (error) {
        console.error("Error getting auth data from storage:", error);
      }
    };

    initializeAuth();

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
  }, [transactionType]);

  // Fetch Personal Categories
  const fetchPersonalCategories = async () => {
    if (!idToken || !userId) {
      console.log("Missing auth data for fetching categories");
      return;
    }

    try {
      const response = await axios.get(
        `${Constants.expoConfig?.extra?.Basic_URL}/api/v1/personal-categories`,
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
          params: {
            userId: userId,
            type: transactionType,
          },
        }
      );

      console.log("Personal categories response:", response.data);
      setPersonalCategories(response.data.data || response.data || []);
    } catch (error) {
      let errorMessage = "Unknown error";
      if (typeof error === "object" && error !== null) {
        if (
          "response" in error &&
          typeof (error as any).response === "object"
        ) {
          errorMessage =
            (error as any).response?.data ||
            (error as any).message ||
            errorMessage;
        } else if ("message" in error) {
          errorMessage = (error as any).message || errorMessage;
        }
      }
      console.error("Error fetching personal categories:", errorMessage);
      // Don't show alert for fetch errors, just log them
      setPersonalCategories([]);
    }
  };

  // Add Personal Category
  const handleAddPersonalCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert("Error", "Please enter a category name");
      return;
    }

    if (!userId || !idToken) {
      Alert.alert("Error", "Authentication required");
      return;
    }

    setAddingCategory(true);
    try {
      const payload = {
        userId: userId,
        name: newCategoryName.trim(),
        type: transactionType,
      };

      console.log("Adding category with payload:", payload);

      const response = await axios.post(
        `${Constants.expoConfig?.extra?.Basic_URL}/api/v1/personal-categories`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Add category response:", response.data);

      Alert.alert("Success", "Category added successfully!");
      setShowAddCategoryModal(false);
      setNewCategoryName("");

      // Refresh the categories list
      await fetchPersonalCategories();
    } catch (error) {
      let errorMessage = "Failed to add category. Please try again.";
      if (typeof error === "object" && error !== null) {
        if (
          "response" in error &&
          typeof (error as any).response === "object"
        ) {
          errorMessage = (error as any).response?.data?.message || errorMessage;
        } else if ("message" in error) {
          errorMessage = (error as any).message || errorMessage;
        }
      }
      console.error("Error adding category:", errorMessage);
      Alert.alert("Error", errorMessage);
    } finally {
      setAddingCategory(false);
    }
  };

  // Fetch categories when auth data is available
  useEffect(() => {
    if (idToken && userId) {
      fetchPersonalCategories();
    }
  }, [idToken, userId, transactionType]);

  // Always set a default category when switching type
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

    // Set default category for the new type
    setTransactionData((prev) => ({
      ...prev,
      category:
        newType === "expense"
          ? expenseCategories[0].id
          : incomeCategories[0].id,
      description: "",
      amount: "",
    }));
  };

  // Combine categories with proper mapping
  const allCategories = [
    ...categories,
    ...personalCategories.map((cat) => ({
      id: cat.categoryId || cat.id || cat.name, // Handle different possible field names
      name: cat.name,
      icon: "star", // Default icon for custom categories
      color: "#10B981", // Default color for custom categories
      type: "custom",
    })),
  ];

  // Fix selectedCategory logic
  const selectedCategory =
    allCategories.find(
      (cat) => cat.id.toLowerCase() === transactionData.category.toLowerCase()
    ) || allCategories[0];

  const handleSubmit = async () => {
    // Validation
    if (!transactionData.amount.trim()) {
      Alert.alert("Error", "Please enter an amount");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        amount: Number.parseFloat(transactionData.amount),
        description: transactionData.description.trim()
          ? transactionData.description
          : "No description",
        category: transactionData.category,
      };

      const endpoint =
        transactionType === "expense"
          ? `${Constants.expoConfig?.extra?.Basic_URL}/api/v1/expense/add`
          : `${Constants.expoConfig?.extra?.Basic_URL}/api/v1/income/add`;

      await refreshInvalidToken();
      await axios.post(endpoint, payload, {
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

  const getAmountColor = () => {
    return transactionType === "expense" ? "#EF4444" : "#10B981";
  };

  const getAmountPrefix = () => {
    return transactionType === "expense" ? "-₹" : "+₹";
  };

  // Recent Categories (stub - implement your logic)
  const recentCategories: typeof categories = [];

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
      <TypeToggle
        transactionType={transactionType}
        handleTypeToggle={handleTypeToggle}
      ></TypeToggle>

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
                    {
                      backgroundColor:
                        (selectedCategory?.color || "#E5E7EB") + "20",
                    },
                  ]}
                >
                  <Ionicons
                    name={(selectedCategory?.icon as any) || "help-circle"}
                    size={20}
                    color={selectedCategory?.color || "#6B7280"}
                  />
                </View>
                <Text style={styles.selectText}>
                  {selectedCategory?.name || categories[0].name}
                </Text>
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
              onChangeText={(text) => {
                setTransactionData((prev) => {
                  const detected = detectCategory(
                    text,
                    String(transactionType)
                  );
                  return {
                    ...prev,
                    description: text,
                    category: detected || prev.category || categories[0].id,
                  };
                });
              }}
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

      <CategoryModal
        show={showCategoryModal}
        setShow={setShowCategoryModal}
        formScale={formScale}
        transactionType={transactionType}
        recentCategories={recentCategories}
        allCategories={allCategories}
        transactionData={transactionData}
        setTransactionData={setTransactionData}
        setShowAddCategoryModal={setShowAddCategoryModal}
        styles={styles}
      />
      <AddCategoryModal
        showAddCategoryModal={showAddCategoryModal}
        setShowAddCategoryModal={setShowAddCategoryModal}
        newCategoryName={newCategoryName}
        setNewCategoryName={setNewCategoryName}
        addingCategory={addingCategory}
        handleAddPersonalCategory={handleAddPersonalCategory}
        transactionType={transactionType}
        styles={styles}
      />

      {renderMemberModal()}
    </KeyboardAvoidingView>
  );
}
