"use client";

import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { getAuth } from "firebase/auth"; // ensure Firebase is initialized
import Constants from "expo-constants";

interface Expense {
  expenseid?: number;
  amount: string;
  description: string;
  category: string;
  createdat: string;
}

interface ExpenseItemProps {
  item: Expense;
  onDelete?: (id: number) => void;
}

const ExpenseItem = ({ item, onDelete }: ExpenseItemProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
      food: "restaurant-outline",
      restaurant: "restaurant-outline",
      transport: "car-outline",
      entertainment: "game-controller-outline",
      shopping: "bag-outline",
      utilities: "flash-outline",
      health: "medical-outline",
      general: "card-outline",
      other: "cash-outline",
    };
    return icons[category.toLowerCase()] || "card-outline";
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      food: "#D97706",
      restaurant: "#D97706",
      transport: "#2563EB",
      entertainment: "#7C3AED",
      shopping: "#DC2626",
      utilities: "#059669",
      health: "#EF4444",
      general: "#4B5563",
      other: "#4B5563",
    };
    return colors[category.toLowerCase()] || "#4B5563";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Today";
    if (diffDays === 2) return "Yesterday";
    if (diffDays <= 7) return `${diffDays - 1} days ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const formatAmount = (amount: string) => {
    const amountNum = Number.parseFloat(amount);
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amountNum);
  };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleDelete = async () => {
    if (!item.expenseid) return;

    Alert.alert(
      "Delete Expense",
      `Are you sure you want to delete this ${formatAmount(item.amount)} expense?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              const auth = getAuth();
              const user = auth.currentUser;

              if (!user) {
                Alert.alert("Error", "User not authenticated.");
                setIsDeleting(false);
                return;
              }

              const idToken = await user.getIdToken();

              await axios.delete(
                `${Constants?.expoConfig?.extra?.Basic_URL}/api/v1/expense/delete/${item.expenseid}`,
                {
                  headers: {
                    Authorization: `Bearer ${idToken}`,
                  },
                }
              );

              Animated.timing(scaleAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }).start(() => {
                if (onDelete) onDelete(item.expenseid!);
              });

              Alert.alert("Success", "Expense deleted successfully.");
            } catch (error) {
              console.error("Delete error:", error);
              Alert.alert("Error", "Failed to delete expense.");
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const color = getCategoryColor(item.category);
  const iconName = getCategoryIcon(item.category);

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ scale: scaleAnim }], opacity: isDeleting ? 0.5 : 1 },
      ]}
    >
      <TouchableOpacity
        style={styles.expenseItem}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        disabled={isDeleting}
      >
        <View style={styles.leftSection}>
          <View
            style={[styles.iconContainer, { backgroundColor: `${color}15` }]}
          >
            <Ionicons name={iconName} size={24} color={color} />
          </View>

          <View style={styles.contentSection}>
            <View style={styles.topRow}>
              <Text style={styles.categoryText}>
                {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
              </Text>
            </View>
            <View style={styles.topRow}>
              {item.description && (
                <Text style={styles.descriptionText} numberOfLines={1}>
                  {item.description}
                </Text>
              )}
              <Text style={[styles.amountText, { color: "#EF4444" }]}>
                -{formatAmount(item.amount)}
              </Text>
            </View>
            <Text style={styles.dateText}>{formatDate(item.createdat)}</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleDelete}
          style={[
            styles.deleteButton,
            isDeleting && styles.deleteButtonDisabled,
          ]}
          disabled={isDeleting}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={isDeleting ? "hourglass-outline" : "trash-outline"}
            size={20}
            color={isDeleting ? "#9CA3AF" : "#EF4444"}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  expenseItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderRadius: 16,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  contentSection: {
    flex: 1,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
  },
  amountText: {
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 12,
    marginTop: 2,
  },
  descriptionText: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 6,
    lineHeight: 20,
  },
  dateText: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  deleteButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
    marginLeft: 12,
  },
  deleteButtonDisabled: {
    backgroundColor: "#F9FAFB",
  },
});

export default ExpenseItem;
