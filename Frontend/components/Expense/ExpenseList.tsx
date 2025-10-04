"use client";

import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import Constants from "expo-constants";
import { getAuth } from "firebase/auth"; // ensure Firebase is initialized
import { useState } from "react";
import {
  Alert,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { triggerRefresh } from "@/hooks/redux/dashboardSlice";
import { useDispatch } from "react-redux";

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
  const dispatch = useDispatch();

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
      food: "#F59E42",
      restaurant: "#F59E42",
      transport: "#2563EB",
      entertainment: "#A78BFA",
      shopping: "#F87171",
      utilities: "#34D399",
      health: "#F87171",
      general: "#6B7280",
      other: "#6B7280",
    };
    return colors[category.toLowerCase()] || "#6B7280";
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

  const isCurrentMonth = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth()
    );
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
              dispatch(triggerRefresh());
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
        styles.card,
        { transform: [{ scale: scaleAnim }], opacity: isDeleting ? 0.5 : 1 },
      ]}
    >
      <View style={styles.row}>
        {/* Icon and category */}
        <View style={styles.leftSection}>
          <View
            style={[styles.iconContainer, { backgroundColor: color + "22" }]}
          >
            {/* More vibrant bg */}
            <Ionicons name={iconName} size={28} color={color} />
          </View>
        </View>
        {/* Description and date */}
        <View style={styles.centerSection}>
          <Text style={styles.categoryText} numberOfLines={1}>
            {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
          </Text>
          {item.description ? (
            <Text style={styles.descriptionText} numberOfLines={1}>
              {item.description}
            </Text>
          ) : null}
          <View style={styles.dateBadge}>
            <Text style={styles.dateBadgeText}>
              {formatDate(item.createdat)}
            </Text>
          </View>
        </View>
        {/* Amount and delete */}
        <View style={styles.rightSection}>
          <Text style={styles.amountText}>-{formatAmount(item.amount)}</Text>
          {onDelete && isCurrentMonth(item.createdat) && (
            <TouchableOpacity
              onPress={handleDelete}
              style={styles.deleteButton}
              disabled={isDeleting}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={isDeleting ? "hourglass-outline" : "trash-outline"}
                size={20}
                color={isDeleting ? "#9CA3AF" : "#EF4444"}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    padding: 0,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
  },
  leftSection: {
    marginRight: 14,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
  },
  centerSection: {
    flex: 1,
    justifyContent: "center",
  },
  categoryText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#22223B",
    marginBottom: 2,
  },
  descriptionText: {
    fontSize: 15,
    color: "#6B7280",
    marginBottom: 4,
  },
  dateBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginTop: 2,
  },
  dateBadgeText: {
    fontSize: 12,
    color: "#7C3AED",
    fontWeight: "600",
  },
  rightSection: {
    alignItems: "flex-end",
    justifyContent: "center",
    minWidth: 80,
  },
  amountText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#EF4444",
    marginBottom: 8,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: "#FEF2F2",
    marginTop: 2,
  },
});

export default ExpenseItem;
