import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ExpenseList() {
  const expenses = [
    { id: 1, title: 'Food', amount: '₹500' },
    { id: 2, title: 'Transport', amount: '₹300' },
  ];

  return (
    <View>
      {expenses.map(exp => (
        <View key={exp.id} style={styles.card}>
          <Text>{exp.title}</Text>
          <Text>{exp.amount}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 12, backgroundColor: '#fff', marginBottom: 8, borderRadius: 6 }
});
