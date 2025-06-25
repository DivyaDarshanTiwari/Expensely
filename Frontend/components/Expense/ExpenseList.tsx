import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import axios from "axios";

export default function ExpenseList() {
  const [expenses, setExpenses] = useState<any[]>([]);

  useEffect(() => {
    const fetcheExpense = async () => {
      try {
        const response = await axios.get(
          "http://localhost:8080/api/v1/expense/getAll/1"
        );
        setExpenses(response.data.expenses);
      } catch (err) {
        console.error(err);
      }
    };
    fetcheExpense();
  }, []);

  return (
    <View>
      {expenses.map((exp) => (
        <View key ={exp.expenseid} style={styles.card}>
          <Text>{exp.category}</Text>
          <Text>₹ {exp.amount}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 12,
    backgroundColor: "#fff",
    marginBottom: 8,
    borderRadius: 6,
  },
});
