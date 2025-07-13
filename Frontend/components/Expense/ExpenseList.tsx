"use client";

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Expense {
  expenseid?: number; // for expense
  incomeid?: number; // for income
  amount: string;
  description: string;
  category: string;
  createdat: string;
}

interface ExpenseItemProps {
  item: Expense;
  type: "expense" | "income";
}

const ExpenseItem = ({ item, type }: ExpenseItemProps) => {
  const getCategoryIcon = (category: string) => {
    const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
      food: "restaurant",
      restaurant: "restaurant",
      transport: "car",
      entertainment: "game-controller",
      shopping: "bag",
      utilities: "flash",
      health: "medical",
      general: "card",
      salary: "briefcase",
      freelance: "laptop",
      investment: "trending-up",
      gift: "gift",
      refund: "refresh",
      bonus: "star",
      other: "cash",
    };
    return icons[category.toLowerCase()] || "card";
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      food: "#F59E0B",
      restaurant: "#F59E0B",
      transport: "#3B82F6",
      entertainment: "#8B5CF6",
      shopping: "#EC4899",
      utilities: "#10B981",
      health: "#EF4444",
      general: "#6B7280",
      salary: "#10B981",
      freelance: "#3B82F6",
      investment: "#8B5CF6",
      gift: "#EC4899",
      refund: "#F59E0B",
      bonus: "#EF4444",
      other: "#6B7280",
    };
    return colors[category.toLowerCase()] || "#6B7280";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const color = getCategoryColor(item.category);
  const iconName = getCategoryIcon(item.category);
  const amountNum = parseFloat(item.amount);

  return (
    <View style={styles.expenseItem}>
      <View style={styles.expenseLeft}>
        <View style={[styles.categoryIcon, { backgroundColor: `${color}20` }]}>
          <Ionicons name={iconName} size={20} color={color} />
        </View>
      </View>
      <View style={styles.expenseRight}>
        <Text
          style={[
            styles.expenseAmount,
            { color: type === "expense" ? "#EF4444" : "#10B981" },
          ]}
        >
          {type === "expense" ? "-" : "+"}₹{amountNum.toFixed(2)}
        </Text>
        <Text style={styles.expenseDescription}>
          {item.description.split(" ").slice(0, 5).join(" ")}
        </Text>
        <Text style={styles.expenseDate}>{formatDate(item.createdat)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
  expenseItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  expenseLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  expenseDetails: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  expenseInfo: {
    fontSize: 14,
    color: "#6B7280",
  },
  expenseRight: {
    alignItems: "flex-end",
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#EF4444",
    marginBottom: 4,
  },
  expenseCategory: {
    fontSize: 12,
    color: "#6B7280",
    textTransform: "capitalize",
  },
  expenseDate: {
    fontSize: 14,
    color: "#888",
    marginTop: 2,
  },
});

export default ExpenseItem;
