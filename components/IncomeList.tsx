import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function IncomeList() {
  const incomes = [
    { id: 1, title: 'Salary', amount: '₹20,000' },
    { id: 2, title: 'Freelance', amount: '₹5,000' },
  ];

  return (
    <View>
      {incomes.map(inc => (
        <View key={inc.id} style={styles.card}>
          <Text>{inc.title}</Text>
          <Text>{inc.amount}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 12, backgroundColor: '#fff', marginBottom: 8, borderRadius: 6 }
});
