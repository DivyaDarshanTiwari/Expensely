"use client";

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Income {
  id: number;
  amount: number;
  description: string;
  category: string;
  createdAt: string;
}

interface IncomeItemProps {
  item: Income;
}

const IncomeItem = ({ item }: IncomeItemProps) => {
  const getSourceIcon = (source: string) => {
    const normalized = source.toLowerCase();
    const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
      salary: "card",
      freelance: "laptop",
      business: "briefcase",
      investment: "trending-up",
      gift: "gift",
      other: "cash",
    };
    return icons[normalized] || "cash";
  };

  const getSourceColor = (source: string) => {
    const normalized = source.toLowerCase();
    const colors: Record<string, string> = {
      salary: "#10B981",
      freelance: "#3B82F6",
      business: "#8B5CF6",
      investment: "#F59E0B",
      gift: "#EC4899",
      other: "#6B7280",
    };
    return colors[normalized] || "#6B7280";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const color = getSourceColor(item.category);
  const iconName = getSourceIcon(item.category);

  return (
    <View style={styles.incomeItem}>
      <View style={styles.incomeLeft}>
        <View style={[styles.sourceIcon, { backgroundColor: `${color}20` }]}>
          <Ionicons name={iconName} size={20} color={color} />
        </View>
      </View>
      <View style={styles.incomeRight}>
        <Text style={styles.incomeAmount}>+₹{item.amount}</Text>
        <Text style={styles.incomeSource}>
          {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
        </Text>
        {item.description ? (
          <Text style={styles.incomeDescription}>
            {item.description.split(" ").slice(0, 5).join(" ")}
          </Text>
        ) : null}
        <Text style={styles.incomeDate}>{formatDate(item.createdAt)}</Text>
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
  incomeItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  incomeLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  sourceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  incomeDetails: {
    flex: 1,
  },
  incomeDescription: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  incomeInfo: {
    fontSize: 14,
    color: "#6B7280",
  },
  incomeRight: {
    alignItems: "flex-end",
  },
  incomeAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#10B981",
    marginBottom: 4,
  },
  incomeSource: {
    fontSize: 12,
    color: "#6B7280",
    textTransform: "capitalize",
  },
  incomeDate: {
    fontSize: 14,
    color: "#888",
    marginTop: 2,
  },
});

export default IncomeItem;
