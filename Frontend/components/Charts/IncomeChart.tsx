import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { PieChart } from "react-native-gifted-charts";

const IncomeChart = () => {
  const data = [
    { value: 50000, color: "#4caf50", text: "Salary" },
    { value: 10000, color: "#2196f3", text: "Freelance" },
    { value: 5000, color: "#ff9800", text: "Investments" },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Income Sources (Last 60 Days)</Text>
      <PieChart
        data={data}
        showText
        textColor="white"
        radius={80}
        innerRadius={40}
        focusOnPress
      />
    </View>
  );
};

export default IncomeChart;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 12,
    alignItems: "center",
  },
  header: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
});
