"use client";

import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import Constants from "expo-constants";
import { getAuth } from "firebase/auth";
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
  const dispatch = useDispatch();

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
      salary: "#34D399",
      freelance: "laptop-outline",
      business: "briefcase-outline",
      investment: "trending-up-outline",
      gift: "gift-outline",
      other: "cash-outline",
    };
    return colors[normalized] || "#6B7280";
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
              dispatch(triggerRefresh());
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
              {formatDate(item.createdAt)}
            </Text>
          </View>
        </View>
        {/* Amount and delete */}
        <View style={styles.rightSection}>
          <Text style={[styles.amountText, { color }]}>
            +{formatAmount(item.amount)}
          </Text>
          {onDelete && isCurrentMonth(item.createdAt) && (
            <TouchableOpacity
              onPress={() => handleDelete(item.id)}
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
    color: "#34D399",
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
    marginBottom: 8,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: "#FEF2F2",
    marginTop: 2,
  },
});

export default IncomeItem;
