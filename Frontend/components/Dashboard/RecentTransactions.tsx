import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import styles from "./styles/styles";

export const RecentTransactions = ({ transactions, categoryIconMap }: any) => {
  const normalizeCategoryKey = (category: string) => {
    if (!category) return "Other";
    return category
      .replace(/\s+/g, "")
      .replace(/^(.)|\s+(.)/g, (c) => c.toUpperCase());
  };

  return (
    <View style={styles.transactionsList}>
      {transactions.map((item: any, index: number) => {
        const normalizedKey = normalizeCategoryKey(item.category);
        const iconData = categoryIconMap[normalizedKey];
        return (
          <View style={styles.transactionItem} key={index}>
            <View
              style={[
                styles.transactionIcon,
                {
                  backgroundColor:
                    item.type === "expense"
                      ? "rgba(239, 68, 68, 0.15)"
                      : "rgba(34, 197, 94, 0.15)",
                },
              ]}
            >
              <Ionicons
                name={iconData?.icon ?? "star"}
                size={20}
                color={iconData?.color ?? "#6B7280"}
              />
            </View>
            <View style={styles.transactionDetails}>
              <Text style={styles.transactionTitle}>
                {iconData?.label ?? item.category}
              </Text>
              <Text style={styles.transactionCategory}>{item.description}</Text>
            </View>
            <View style={styles.transactionRight}>
              <Text
                style={[
                  styles.transactionAmount,
                  { color: item.type === "expense" ? "red" : "green" },
                ]}
              >
                {item.amount}
              </Text>
              <Text style={styles.transactionDate}>{item.dayAgo}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};
