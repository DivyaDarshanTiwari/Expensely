import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function RecentTransactionList() {
  const transactions = [
    { id: 1, title: "Groceries", amount: "-₹500" },
    { id: 2, title: "Salary", amount: "+₹20,000" },
    { id: 3, title: "Electricity Bill", amount: "-₹1,200" },
  ];

  return (
    <View>
      {transactions.map((tx) => (
        <View key={tx.id} style={styles.row}>
          <Text>{tx.title}</Text>
          <Text>{tx.amount}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
});
