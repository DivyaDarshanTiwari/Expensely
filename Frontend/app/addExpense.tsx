"use client";
import { Ionicons } from "@expo/vector-icons";
import type React from "react";

import axios from "axios";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { getStoredToken } from "../utils/storage";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface Member {
  id: number;
  username: string;
}

interface ExpenseData {
  amount: string;
  description: string;
  category: string;
  date: string;
  paidBy: Member | null; // Changed to Member | null
  splitType: "equal" | "unequal"; // New field
  splitAmong: Member[];
  unequalSplits: { [key: string]: string }; // New field for custom amounts
}

const AddExpense = () => {
  const router = useRouter();
  const { groupId, groupName, groupData } = useLocalSearchParams();
  const [expenseData, setExpenseData] = useState<ExpenseData>({
    amount: "",
    description: "",
    category: "general",
    date: new Date().toISOString().split("T")[0],
    paidBy: null, // Initialize as null
    splitType: "equal", // Default to equal split
    splitAmong: [],
    unequalSplits: {},
  });
  const [members, setMembers] = useState<Member[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showSplitTypeModal, setShowSplitTypeModal] = useState(false); // New modal state
  const [showSplitMemberModal, setShowSplitMemberModal] = useState(false);
  const [showUnequalSplitModal, setShowUnequalSplitModal] = useState(false); // New modal state
  const [loading, setLoading] = useState(false);
  const [idToken, setIdToken] = useState("");

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const headerSlide = useRef(new Animated.Value(-50)).current;
  const formScale = useRef(new Animated.Value(0.95)).current; // Used for main form and modal content scale

  const categories = [
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
      id: "Activities",
      name: "Activities & Tickets",
      icon: "ticket",
      color: "#F472B6",
    },
    { id: "Shopping", name: "Shopping", icon: "bag", color: "#EC4899" },
    { id: "Utilities", name: "Utilities", icon: "flash", color: "#10B981" },
    {
      id: "Health",
      name: "Health & Medical",
      icon: "medical",
      color: "#EF4444",
    },
    {
      id: "Miscellaneous",
      name: "Miscellaneous",
      icon: "ellipsis-horizontal",
      color: "#6B7280",
    },
  ];

  const keywordCategoryMap = [
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
      categoryId: "Activities",
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
  ];

  function detectCategory(description: string) {
    const desc = description.toLowerCase();
    for (const entry of keywordCategoryMap) {
      if (entry.keywords.some((kw) => desc.includes(kw))) {
        return entry.categoryId;
      }
    }
    return null;
  }

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
        const membersData = res.data || [];
        setMembers(membersData);
        // Set current user as default payer if available
        if (membersData.length > 0) {
          setExpenseData((prev) => ({
            ...prev,
            paidBy: membersData[0],
          }));
        }
      } catch (error) {
        console.error("Failed to fetch members", error);
        Alert.alert("Error", "Could not fetch group members");
      }
    };

    const fetchTokenAndMembers = async () => {
      try {
        const token = await getStoredToken();
        if (!token) {
          Alert.alert("Error", "Please log in to continue");
          router.back();
          return;
        }
        setIdToken(token);
        fetchMembers(token);
      } catch (error) {
        console.error("Error getting stored token:", error);
        Alert.alert("Error", "Authentication failed");
        router.back();
      }
    };
    fetchTokenAndMembers();

    // Start animations for main form
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
  }, [groupId]);

  const selectedCategory =
    categories.find((cat) => cat.id === expenseData.category) ||
    categories[categories.length - 1];

  const validateUnequalSplits = (): boolean => {
    const totalAmount = Number.parseFloat(expenseData.amount) || 0;
    const splitSum = Object.values(expenseData.unequalSplits).reduce(
      (sum, amount) => sum + (Number.parseFloat(amount) || 0),
      0
    );
    return Math.abs(totalAmount - splitSum) < 0.01; // Allow for small floating point differences
  };

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
      Alert.alert("Error", "Please select who paid");
      return false;
    }
    if (expenseData.splitAmong.length === 0) {
      Alert.alert("Error", "Please select members to split the expense among");
      return false;
    }
    if (expenseData.splitType === "unequal" && !validateUnequalSplits()) {
      Alert.alert(
        "Error",
        "Unequal split amounts must sum to the total amount"
      );
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const paidByUsername =
        typeof expenseData.paidBy === "object"
          ? expenseData.paidBy?.username
          : expenseData.paidBy;

      let sharesPayload: { username: string; amountOwned: number }[] = [];

      if (expenseData.splitType === "equal") {
        const perPersonAmount =
          Number.parseFloat(expenseData.amount) / expenseData.splitAmong.length;
        sharesPayload = expenseData.splitAmong.map((member) => ({
          username: member.username,
          amountOwned: perPersonAmount,
        }));
      } else {
        // Unequal split
        sharesPayload = expenseData.splitAmong.map((member) => ({
          username: member.username,
          amountOwned: Number.parseFloat(
            expenseData.unequalSplits[member.username] || "0"
          ),
        }));
      }

      const payload = {
        groupId: Number.parseInt(groupId as string),
        paidBy: paidByUsername,
        amount: Number.parseFloat(expenseData.amount),
        category: expenseData.category,
        description: expenseData.description,
        date: expenseData.date,
        shares: sharesPayload,
      };

      await axios.post(
        `${Constants.expoConfig?.extra?.Group_URL}/api/v1/groupExpense/add`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );
      Alert.alert("Success", "Expense added successfully!", [
        {
          text: "OK",
          onPress: () =>
            router.push({
              pathname: "/groupDetails",
              params: {
                groupId: groupId,
                groupName: groupName,
                groupData: groupData, // for complex objects
                refresh: "true",
              },
            }),
        },
      ]);
    } catch (err) {
      console.error("Error creating expense:", err);
      Alert.alert("Error", "Failed to create expense. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getPaidByDisplayName = () => {
    if (typeof expenseData.paidBy === "object" && expenseData.paidBy !== null) {
      return expenseData.paidBy.username;
    }
    return expenseData.paidBy || "Select who paid";
  };

  const getPaidByInitial = () => {
    const name = getPaidByDisplayName();
    return name.charAt(0).toUpperCase();
  };

  const getSplitSummary = () => {
    if (expenseData.splitAmong.length === 0)
      return "Select members to split among";

    if (expenseData.splitType === "equal") {
      const perPerson =
        Number.parseFloat(expenseData.amount) / expenseData.splitAmong.length;
      return `${expenseData.splitAmong.length} member${expenseData.splitAmong.length !== 1 ? "s" : ""} • ₹${perPerson.toFixed(2)} each`;
    } else {
      const totalSplit = Object.values(expenseData.unequalSplits).reduce(
        (sum, amount) => sum + (Number.parseFloat(amount) || 0),
        0
      );
      return `${expenseData.splitAmong.length} member${expenseData.splitAmong.length !== 1 ? "s" : ""} • ₹${totalSplit.toFixed(2)} total`;
    }
  };

  // Helper to animate out and then close modal
  const closeModal = (
    setter: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    Animated.timing(formScale, {
      toValue: 0.95, // Scale down slightly
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setter(false);
      formScale.setValue(1); // Reset scale for next open
    });
  };

  const renderSplitMemberModal = () => (
    <Modal
      visible={showSplitMemberModal}
      transparent
      animationType="fade"
      onRequestClose={() => closeModal(setShowSplitMemberModal)}
      onShow={() =>
        Animated.spring(formScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }).start()
      }
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[styles.modalContent, { transform: [{ scale: formScale }] }]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Split Among</Text>
            <TouchableOpacity
              onPress={() => closeModal(setShowSplitMemberModal)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalScrollContent}>
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
              <View
                style={[styles.memberAvatar, { backgroundColor: "#10B981" }]}
              >
                <Ionicons name="people" size={16} color="white" />
              </View>
              <Text style={styles.memberName}>All Members</Text>
              {expenseData.splitAmong.length === members.length && (
                <Ionicons name="checkmark" size={24} color="#10B981" />
              )}
            </TouchableOpacity>
            {members.map((item) => {
              const isSelected = expenseData.splitAmong.some(
                (member) => member.username === item.username
              );
              return (
                <TouchableOpacity
                  key={`split-member-modal-${item.id}`}
                  style={[
                    styles.memberItem,
                    isSelected && styles.memberItemSelected,
                  ]}
                  onPress={() => {
                    setExpenseData((prev) => ({
                      ...prev,
                      splitAmong: isSelected
                        ? prev.splitAmong.filter(
                            (member) => member.id !== item.id
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
            })}
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalDoneButton}
              onPress={() => closeModal(setShowSplitMemberModal)}
            >
              <Text style={styles.modalDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );

  const renderCategoryModal = () => (
    <Modal
      visible={showCategoryModal}
      transparent
      animationType="fade"
      onRequestClose={() => closeModal(setShowCategoryModal)}
      onShow={() =>
        Animated.spring(formScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }).start()
      }
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[styles.modalContent, { transform: [{ scale: formScale }] }]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Category</Text>
            <TouchableOpacity
              onPress={() => closeModal(setShowCategoryModal)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalScrollContent}>
            {categories.map((item) => (
              <TouchableOpacity
                key={`category-${item.id}`}
                style={[
                  styles.categoryItem,
                  expenseData.category === item.id &&
                    styles.categoryItemSelected,
                ]}
                onPress={() => {
                  setExpenseData((prev) => ({ ...prev, category: item.id }));
                  closeModal(setShowCategoryModal);
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
            ))}
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
      onRequestClose={() => closeModal(setShowMemberModal)}
      onShow={() =>
        Animated.spring(formScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }).start()
      }
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[styles.modalContent, { transform: [{ scale: formScale }] }]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Who Paid?</Text>
            <TouchableOpacity
              onPress={() => closeModal(setShowMemberModal)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalScrollContent}>
            {members.map((item) => (
              <TouchableOpacity
                key={`member-modal-${item.id}`}
                style={[
                  styles.memberItem,
                  expenseData.paidBy?.username === item.username &&
                    styles.memberItemSelected,
                ]}
                onPress={() => {
                  setExpenseData((prev) => ({
                    ...prev,
                    paidBy: item,
                  }));
                  closeModal(setShowMemberModal);
                }}
              >
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberInitial}>
                    {(item.username.charAt(0) || "?").toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.memberName}>{item.username}</Text>
                {expenseData.paidBy?.username === item.username && (
                  <Ionicons name="checkmark" size={24} color="#10B981" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );

  const renderSplitTypeModal = () => (
    <Modal
      visible={showSplitTypeModal}
      transparent
      animationType="fade"
      onRequestClose={() => closeModal(setShowSplitTypeModal)}
      onShow={() =>
        Animated.spring(formScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }).start()
      }
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[styles.modalContent, { transform: [{ scale: formScale }] }]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Split Type</Text>
            <TouchableOpacity
              onPress={() => closeModal(setShowSplitTypeModal)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <TouchableOpacity
              style={[
                styles.splitTypeItem,
                expenseData.splitType === "equal" &&
                  styles.splitTypeItemSelected,
              ]}
              onPress={() => {
                setExpenseData((prev) => ({
                  ...prev,
                  splitType: "equal",
                  splitAmong: [], // Reset members when changing type
                  unequalSplits: {}, // Reset unequal splits
                }));
                closeModal(setShowSplitTypeModal);
              }}
            >
              <View
                style={[styles.splitTypeIcon, { backgroundColor: "#D1FAE5" }]}
              >
                <Ionicons name="people" size={28} color="#10B981" />
              </View>
              <View style={styles.splitTypeTextContainer}>
                <Text style={styles.splitTypeName}>Equal Split</Text>
                <Text style={styles.splitTypeDescription}>
                  Split amount equally among selected members
                </Text>
              </View>
              {expenseData.splitType === "equal" && (
                <Ionicons name="checkmark" size={24} color="#10B981" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.splitTypeItem,
                expenseData.splitType === "unequal" &&
                  styles.splitTypeItemSelected,
              ]}
              onPress={() => {
                setExpenseData((prev) => ({
                  ...prev,
                  splitType: "unequal",
                  splitAmong: [], // Reset members when changing type
                  unequalSplits: {}, // Reset unequal splits
                }));
                closeModal(setShowSplitTypeModal);
              }}
            >
              <View
                style={[styles.splitTypeIcon, { backgroundColor: "#DBEAFE" }]}
              >
                <Ionicons name="calculator" size={28} color="#3B82F6" />
              </View>
              <View style={styles.splitTypeTextContainer}>
                <Text style={styles.splitTypeName}>Unequal Split</Text>
                <Text style={styles.splitTypeDescription}>
                  Enter custom amounts for each member
                </Text>
              </View>
              {expenseData.splitType === "unequal" && (
                <Ionicons name="checkmark" size={24} color="#3B82F6" />
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );

  const renderUnequalSplitModal = () => (
    <Modal
      visible={showUnequalSplitModal}
      transparent
      animationType="fade"
      onRequestClose={() => closeModal(setShowUnequalSplitModal)}
      onShow={() =>
        Animated.spring(formScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }).start()
      }
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[styles.modalContent, { transform: [{ scale: formScale }] }]}
        >
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Unequal Split</Text>
              <Text style={styles.modalSubtitle}>
                Total: ₹
                {Number.parseFloat(expenseData.amount || "0").toFixed(2)}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => closeModal(setShowUnequalSplitModal)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalScrollContent}>
            {members.map((member) => {
              const memberAmount =
                expenseData.unequalSplits[member.username] || "";
              return (
                <View
                  key={`unequal-split-${member.id}`}
                  style={styles.unequalSplitItem}
                >
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberInitial}>
                      {(member.username.charAt(0) || "?").toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.memberName}>{member.username}</Text>
                  <View style={styles.unequalInputContainer}>
                    <Text style={styles.currencySymbolSmall}>₹</Text>
                    <TextInput
                      style={styles.unequalInput}
                      placeholder="0.00"
                      placeholderTextColor="#9CA3AF"
                      value={memberAmount}
                      onChangeText={(text) => {
                        const amount = text.replace(/[^0-9.]/g, ""); // Only allow numbers and one decimal
                        setExpenseData((prev) => {
                          const newUnequalSplits = { ...prev.unequalSplits };
                          let updatedSplitAmong: Member[] = [];

                          if (amount && Number.parseFloat(amount) > 0) {
                            newUnequalSplits[member.username] = amount;
                          } else {
                            delete newUnequalSplits[member.username];
                          }

                          // Reconstruct splitAmong based on who has an amount in unequalSplits
                          updatedSplitAmong = members.filter((m) => {
                            const splitAmount = Number.parseFloat(
                              newUnequalSplits[m.username] || "0"
                            );
                            return splitAmount > 0;
                          });

                          return {
                            ...prev,
                            unequalSplits: newUnequalSplits,
                            splitAmong: updatedSplitAmong,
                          };
                        });
                      }}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              );
            })}
            {/* Summary */}
            {Object.keys(expenseData.unequalSplits).length > 0 && (
              <View style={styles.unequalSummaryCard}>
                <View style={styles.unequalSummaryRow}>
                  <Text style={styles.unequalSummaryLabel}>Total Amount:</Text>
                  <Text style={styles.unequalSummaryValue}>
                    ₹{Number.parseFloat(expenseData.amount || "0").toFixed(2)}
                  </Text>
                </View>
                <View style={styles.unequalSummaryRow}>
                  <Text style={styles.unequalSummaryLabel}>Split Total:</Text>
                  <Text style={styles.unequalSummaryValue}>
                    ₹
                    {Object.values(expenseData.unequalSplits)
                      .reduce(
                        (sum, amount) => sum + (Number.parseFloat(amount) || 0),
                        0
                      )
                      .toFixed(2)}
                  </Text>
                </View>
                <View style={styles.unequalSummaryRow}>
                  <Text style={styles.unequalSummaryLabel}>Remaining:</Text>
                  <Text
                    style={[
                      styles.unequalSummaryValue,
                      validateUnequalSplits()
                        ? styles.textGreen
                        : styles.textRed,
                    ]}
                  >
                    ₹
                    {(
                      Number.parseFloat(expenseData.amount) -
                      Object.values(expenseData.unequalSplits).reduce(
                        (sum, amount) => sum + (Number.parseFloat(amount) || 0),
                        0
                      )
                    ).toFixed(2)}
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[
                styles.modalDoneButton,
                !validateUnequalSplits() && styles.modalDoneButtonDisabled,
              ]}
              onPress={() => closeModal(setShowUnequalSplitModal)}
              disabled={!validateUnequalSplits()}
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
              onChangeText={(text) => {
                setExpenseData((prev) => {
                  const detected = detectCategory(text);
                  return {
                    ...prev,
                    description: text,
                    category: detected || prev.category,
                  };
                });
              }}
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
          {/* Date */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Date</Text>
            <TextInput
              style={styles.textInput}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9CA3AF"
              value={expenseData.date}
              onChangeText={(text) =>
                setExpenseData((prev) => ({ ...prev, date: text }))
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
                        {getPaidByInitial()}
                      </Text>
                    </View>
                    <Text style={styles.selectText}>
                      {getPaidByDisplayName()}
                    </Text>
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
          {/* Split Type */}
          {expenseData.paidBy && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Split Type</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setShowSplitTypeModal(true)}
              >
                <View style={styles.selectContent}>
                  {expenseData.splitType === "equal" ? (
                    <>
                      <Ionicons name="people" size={20} color="#10B981" />
                      <Text style={styles.selectText}>Equal Split</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="calculator" size={20} color="#3B82F6" />
                      <Text style={styles.selectText}>Unequal Split</Text>
                    </>
                  )}
                </View>
                <Ionicons name="chevron-down" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
          )}
          {/* Split Among */}
          {expenseData.paidBy && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Split Among</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => {
                  if (expenseData.splitType === "equal") {
                    setShowSplitMemberModal(true);
                  } else {
                    setShowUnequalSplitModal(true);
                  }
                }}
              >
                <View style={styles.selectContent}>
                  <Text
                    style={[
                      styles.selectText,
                      expenseData.splitAmong.length === 0 && {
                        color: "#9CA3AF",
                      },
                    ]}
                  >
                    {getSplitSummary()}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
          )}
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
      {renderSplitMemberModal()}
      {renderSplitTypeModal()}
      {renderUnequalSplitModal()}
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
  modalSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
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
  modalDoneButtonDisabled: {
    opacity: 0.5,
  },
  modalDoneText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  // New styles for Split Type Modal
  modalBody: {
    padding: 20,
    paddingBottom: 30, // Added padding to prevent cut-off
  },
  splitTypeItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
    backgroundColor: "#F9FAFB",
  },
  splitTypeItemSelected: {
    borderColor: "#10B981",
    backgroundColor: "#F0FDF4",
  },
  splitTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  splitTypeTextContainer: {
    flex: 1,
  },
  splitTypeName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  splitTypeDescription: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  // New styles for Unequal Split Modal
  unequalSplitItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  unequalInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginLeft: 10,
  },
  currencySymbolSmall: {
    fontSize: 16,
    color: "#6B7280",
    marginRight: 4,
  },
  unequalInput: {
    fontSize: 16,
    color: "#111827",
    width: 70,
    textAlign: "right",
    padding: 0, // Remove default padding
  },
  unequalSummaryCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  unequalSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  unequalSummaryLabel: {
    fontSize: 15,
    color: "#374151",
    fontWeight: "500",
  },
  unequalSummaryValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  textGreen: {
    color: "#10B981",
  },
  textRed: {
    color: "#EF4444",
  },
  modalScrollContent: {
    maxHeight: screenHeight * 0.5, // Adjust max height to be 50% of screen height
    paddingBottom: 20, // Add padding to the bottom of scrollable content
  },
});

export default AddExpense;
