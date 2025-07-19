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
import Constants from "expo-constants";
import { getAuth } from "firebase/auth";

interface Income {
  id: number;
  amount: number;
  description: string;
  category: string;
  createdAt: string;
}

interface IncomeItemProps {
  item: Income;
  onDelete?: (id: number) => void;
}

const IncomeItem = ({ item, onDelete }: IncomeItemProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));

  const getSourceIcon = (source: string) => {
    const normalized = source.toLowerCase();
    const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
      salary: "card-outline",
      freelance: "laptop-outline",
      business: "briefcase-outline",
      investment: "trending-up-outline",
      gift: "gift-outline",
      other: "cash-outline",
    };
    return icons[normalized] || "cash-outline";
  };

  const getSourceColor = (source: string) => {
    const normalized = source.toLowerCase();
    const colors: Record<string, string> = {
      salary: "#059669",
      freelance: "#2563EB",
      business: "#7C3AED",
      investment: "#D97706",
      gift: "#DC2626",
      other: "#4B5563",
    };
    return colors[normalized] || "#4B5563";
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

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const isCurrentMonth = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth()
    );
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

  const handleDelete = async (id: any) => {
    Alert.alert(
      "Delete Income",
      `Are you sure you want to delete this ${formatAmount(item.amount)} income?`,
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => setIsDeleting(false),
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              const auth = getAuth();
              const user = auth.currentUser;
              const idToken = await user?.getIdToken();

              if (!idToken) {
                Alert.alert("Error", "User not authenticated.");
                setIsDeleting(false);
                return;
              }

              await axios.delete(
                `${Constants?.expoConfig?.extra?.Basic_URL}/api/v1/income/delete/${id}`,
                {
                  headers: { Authorization: `Bearer ${idToken}` },
                }
              );

              Animated.timing(scaleAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }).start(() => {
                if (onDelete) onDelete(item.id);
              });

              Alert.alert("Success", "Income deleted successfully");
            } catch (error) {
              console.error("Delete error:", error);
              Alert.alert(
                "Error",
                "Failed to delete income. Please try again."
              );
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const color = getSourceColor(item.category);
  const iconName = getSourceIcon(item.category);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnim }],
          opacity: isDeleting ? 0.5 : 1,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.incomeItem}
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
              <Text style={[styles.amountText, { color }]}>
                +{formatAmount(item.amount)}
              </Text>
            </View>

            <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>

        {isCurrentMonth(item.createdAt) && (
          <TouchableOpacity
            onPress={() => handleDelete(item.id)}
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
        )}
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
  incomeItem: {
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

export default IncomeItem;
