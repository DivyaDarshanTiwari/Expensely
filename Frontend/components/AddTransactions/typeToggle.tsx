// components/AddTransactions/TypeToggle.tsx
import React from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "@/components/AddTransactions/styles/styles";

export default function TypeToggle({ transactionType, handleTypeToggle }: any) {
  return (
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
  );
}
