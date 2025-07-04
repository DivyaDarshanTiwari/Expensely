import axios from "axios";
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";

export default function IncomeList() {
  const [incomes, setIncomes] = useState<any[]>([]);

  useEffect(() => {
    const fetcheIncome = async () => {
      try {
        const response = await axios.get(
<<<<<<< HEAD
          "https://07ttqbzs-8080.inc1.devtunnels.ms/api/v1/income/getAll/1"
=======
          "http://localhost:8080/api/v1/income/getAll/1"
>>>>>>> e55071f55e55eada3dadb01a59e01e92d77178bb
        );
        setIncomes(response.data.incomes);
      } catch (err) {
        console.error(err);
      }
    };
    fetcheIncome();
  }, []);

  return (
    <View>
      {incomes.map((inc) => (
        <View key={inc.id} style={styles.card}>
          <Text>{inc.category}</Text>
          <Text>₹ {inc.amount}</Text>
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
