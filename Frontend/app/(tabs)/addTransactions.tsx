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
  Dimensions,
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
import { getStoredToken, getStoredUserId } from "../../utils/storage";
import { refreshInvalidToken } from "@/utils/refreshIfInvalid";

const { width: screenWidth } = Dimensions.get("window");

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

  // Add Category Modal
  const renderAddCategoryModal = () => (
    <Modal visible={showAddCategoryModal} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Personal Category</Text>
            <TouchableOpacity
              onPress={() => {
                setShowAddCategoryModal(false);
                setNewCategoryName("");
              }}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={{ padding: 20 }}>
            <Text style={styles.inputLabel}>Category Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder={`Enter ${transactionType} category name`}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              autoFocus
              maxLength={50}
            />

            <TouchableOpacity
              style={[
                styles.submitButton,
                {
                  marginTop: 20,
                  opacity: !newCategoryName.trim() || addingCategory ? 0.6 : 1,
                },
              ]}
              onPress={handleAddPersonalCategory}
              disabled={!newCategoryName.trim() || addingCategory}
            >
              <LinearGradient
                colors={["#10B981", "#059F69"]}
                style={styles.submitGradient}
              >
                <Text style={styles.submitText}>
                  {addingCategory ? "Adding..." : "Add Category"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Category Modal with improved error handling
  const renderCategoryModal = () => (
    <Modal
      visible={showCategoryModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowCategoryModal(false)}
    >
      <View style={styles.classyModalOverlay}>
        <Animated.View
          style={[
            styles.classyModalContent,
            { transform: [{ scale: formScale }] },
          ]}
        >
          {/* Modal Header */}
          <View style={styles.classyModalHeader}>
            <View style={styles.modalHeaderContent}>
              <Text style={styles.classyModalTitle}>Choose Category</Text>
              <Text style={styles.classyModalSubtitle}>
                Select a category for your {transactionType}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowCategoryModal(false)}
              style={styles.classyCloseButton}
            >
              <Ionicons name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.classyModalScrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.classyScrollContent}
          >
            {/* Recent Categories Section */}
            {recentCategories.length > 0 && (
              <>
                <View style={styles.sectionHeaderContainer}>
                  <Ionicons name="time-outline" size={16} color="#8B5CF6" />
                  <Text style={styles.classySectionTitle}>Recently Used</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.recentCategoriesContainer}
                >
                  {recentCategories.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.recentCategoryChip,
                        transactionData.category === item.id &&
                          styles.recentCategoryChipSelected,
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
                          styles.recentChipIcon,
                          { backgroundColor: item.color + "20" },
                        ]}
                      >
                        <Ionicons
                          name={item.icon as any}
                          size={16}
                          color={item.color}
                        />
                      </View>
                      <Text
                        style={[
                          styles.recentChipText,
                          transactionData.category === item.id &&
                            styles.recentChipTextSelected,
                        ]}
                      >
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            {/* All Categories Section */}
            <View style={styles.sectionHeaderContainer}>
              <Ionicons name="grid-outline" size={16} color="#10B981" />
              <Text style={styles.classySectionTitle}>All Categories</Text>
            </View>

            <View style={styles.classyCategoriesContainer}>
              <View style={styles.categoriesGrid}>
                {allCategories.map((item, index) => {
                  const isSelected = transactionData.category === item.id;
                  return (
                    <TouchableOpacity
                      key={`${item.id}-${index}`} // Ensure unique keys
                      style={[
                        styles.classyCategoryCardGrid,
                        isSelected && styles.classyCategoryCardSelected,
                        index % 2 === 0
                          ? styles.categoryCardLeft
                          : styles.categoryCardRight,
                      ]}
                      onPress={() => {
                        setTransactionData((prev) => ({
                          ...prev,
                          category: item.id,
                        }));
                        setShowCategoryModal(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.classyCategoryContentGrid}>
                        <View
                          style={[
                            styles.classyCategoryIconContainerGrid,
                            { backgroundColor: item.color + "15" },
                            isSelected && {
                              backgroundColor: item.color + "25",
                            },
                          ]}
                        >
                          <Ionicons
                            name={item.icon as any}
                            size={20}
                            color={item.color}
                          />
                        </View>
                        <View style={styles.classyCategoryTextContainerGrid}>
                          <Text
                            style={[
                              styles.classyCategoryNameGrid,
                              isSelected && styles.classyCategoryNameSelected,
                            ]}
                            numberOfLines={1}
                          >
                            {item.name}
                          </Text>
                          <Text style={styles.classyCategoryTypeGrid}>
                            {item.type === "custom"
                              ? "Custom"
                              : transactionType === "expense"
                                ? "Expense"
                                : "Income"}
                          </Text>
                        </View>
                      </View>
                      {isSelected && (
                        <View style={styles.selectedIndicatorGrid}>
                          <Ionicons
                            name="checkmark-circle"
                            size={16}
                            color={item.color}
                          />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}

                {/* Add New Category Card */}
                <TouchableOpacity
                  style={styles.addCategoryCardClassyGrid}
                  onPress={() => {
                    setShowCategoryModal(false);
                    setShowAddCategoryModal(true);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.classyCategoryContentGrid}>
                    <View style={styles.addCategoryIconContainerGrid}>
                      <Ionicons
                        name="add-circle-outline"
                        size={20}
                        color="#10B981"
                      />
                    </View>
                    <View style={styles.classyCategoryTextContainerGrid}>
                      <Text style={styles.addCategoryTextGrid}>
                        Create New Category
                      </Text>
                      <Text style={styles.addCategorySubtextGrid}>
                        Add your custom category
                      </Text>
                    </View>
                  </View>
                  <View style={styles.addCategoryArrowGrid}>
                    <Ionicons
                      name="chevron-forward"
                      size={14}
                      color="#10B981"
                    />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
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
      <View style={styles.toggleContainer}>
        <View style={styles.toggleWrapper}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              transactionType === "expense" && styles.toggleButtonActiveExpense,
            ]}
            onPress={() => handleTypeToggle("expense")}
            activeOpacity={0.8}
          >
            <Ionicons
              name="remove-circle"
              size={20}
              color={transactionType === "expense" ? "white" : "#EF4444"}
            />
            <Text
              style={[
                styles.toggleText,
                transactionType === "expense" && styles.toggleTextActiveExpense,
              ]}
            >
              Expense
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              transactionType === "income" && styles.toggleButtonActiveIncome,
            ]}
            onPress={() => handleTypeToggle("income")}
            activeOpacity={0.8}
          >
            <Ionicons
              name="add-circle"
              size={20}
              color={transactionType === "income" ? "white" : "#10B981"}
            />
            <Text
              style={[
                styles.toggleText,
                transactionType === "income" && styles.toggleTextActiveIncome,
              ]}
            >
              Income
            </Text>
          </TouchableOpacity>
        </View>
      </View>

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

      {renderCategoryModal()}
      {renderAddCategoryModal()}
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
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  toggleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "transparent",
  },
  toggleButtonActiveExpense: {
    backgroundColor: "#EF4444",
  },
  toggleButtonActiveIncome: {
    backgroundColor: "#10B981",
  },
  toggleText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
    marginLeft: 8,
  },
  toggleTextActiveExpense: {
    color: "white",
  },
  toggleTextActiveIncome: {
    color: "white",
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
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E0E7FF",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: {
    backgroundColor: "#D1FAE5",
  },
  chipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10B981",
    marginLeft: 8,
  },
  improvedModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(30, 41, 59, 0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  improvedModalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    marginHorizontal: 16,
    width: "90%",
    maxWidth: 400,
    maxHeight: "85%",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#374151",
    marginTop: 12,
    marginBottom: 4,
    marginLeft: 20,
  },
  categoryCardsContainer: {
    paddingHorizontal: 16,
  },
  categoryCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 4,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  categoryCardSelected: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#10B981",
  },
  categoryCardContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  categoryCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  categoryCardLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
    flex: 1,
  },
  categoryCardLabelSelected: {
    color: "#10B981",
    fontWeight: "600",
  },
  categorySeparator: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginHorizontal: 20,
    marginVertical: 4,
  },
  addCategoryCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
  },
  addCategoryCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#10B98120",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  addCategoryCardLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#10B981",
    flex: 1,
  },
  categoryGridContainer: {
    paddingHorizontal: 8,
  },
  categoryRow: {
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  categoryGridCell: {
    width: (screenWidth * 0.9 - 64) / 3,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    backgroundColor: "transparent",
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  categoryGridCellSelected: {
    backgroundColor: "#F0FDF4",
  },
  categoryGridLabel: {
    fontSize: 13,
    color: "#374151",
    textAlign: "center",
    fontWeight: "500",
  },
  categoryGridLabelSelected: {
    color: "#10B981",
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  addCategoryGridCell: {
    width: (screenWidth * 0.9 - 64) / 3,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: "#A7F3D0",
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    borderStyle: "dashed",
  },
  addCategoryGridLabel: {
    fontSize: 12,
    color: "#10B981",
    fontWeight: "600",
    textAlign: "center",
  },
  classyModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  classyModalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    minHeight: "60%",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  classyModalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalHeaderContent: {
    flex: 1,
  },
  classyModalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  classyModalSubtitle: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "400",
  },
  classyCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 16,
  },
  classyModalScrollView: {
    flex: 1,
  },
  classyScrollContent: {
    paddingBottom: 24,
  },
  sectionHeaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 12,
  },
  classySectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginLeft: 8,
  },
  recentCategoriesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  recentCategoryChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  recentCategoryChipSelected: {
    backgroundColor: "#F0FDF4",
    borderColor: "#10B981",
  },
  recentChipIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },
  recentChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#475569",
  },
  recentChipTextSelected: {
    color: "#10B981",
    fontWeight: "600",
  },
  classyCategoriesContainer: {
    paddingHorizontal: 16,
  },
  classyCategoryCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginHorizontal: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  classyCategoryCardSelected: {
    backgroundColor: "#FEFFFE",
    borderColor: "#10B981",
    borderWidth: 1.5,
    elevation: 4,
    shadowOpacity: 0.1,
  },
  classyCategoryContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  classyCategoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  classyCategoryTextContainer: {
    flex: 1,
  },
  classyCategoryName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 2,
  },
  classyCategoryNameSelected: {
    color: "#10B981",
  },
  classyCategoryType: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "400",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  selectedIndicator: {
    marginLeft: 12,
  },
  addCategoryCardClassy: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FAFAFA",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginHorizontal: 8,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: "#10B981",
    borderStyle: "dashed",
  },
  addCategoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#10B98115",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  addCategoryText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#10B981",
    marginBottom: 2,
  },
  addCategorySubtext: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "400",
  },
  addCategoryArrow: {
    marginLeft: 12,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  classyCategoryCardGrid: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  categoryCardLeft: {
    marginRight: 4,
  },
  categoryCardRight: {
    marginLeft: 4,
  },
  classyCategoryContentGrid: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  classyCategoryIconContainerGrid: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  classyCategoryTextContainerGrid: {
    flex: 1,
  },
  classyCategoryNameGrid: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 1,
  },
  classyCategoryTypeGrid: {
    fontSize: 10,
    color: "#64748B",
    fontWeight: "400",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  selectedIndicatorGrid: {
    marginLeft: 4,
  },
  addCategoryCardClassyGrid: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FAFAFA",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: "#10B981",
    borderStyle: "dashed",
  },
  addCategoryIconContainerGrid: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#10B98115",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  addCategoryTextGrid: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10B981",
    marginBottom: 1,
  },
  addCategorySubtextGrid: {
    fontSize: 10,
    color: "#059669",
    fontWeight: "400",
  },
  addCategoryArrowGrid: {
    marginLeft: 4,
  },
});
