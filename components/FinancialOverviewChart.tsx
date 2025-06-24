import React from 'react';
import { View, StyleSheet } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';

export default function FinancialOverviewChart({ type }: { type: 'balance' | 'income' }) {
  const data = type === 'balance'
    ? [
        { value: 50, color: '#007AFF', text: 'Balance' },
        { value: 25, color: '#FF3B30', text: 'Expense' },
        { value: 25, color: '#34C759', text: 'Income' },
      ]
    : [
        { value: 60, color: '#FF9500', text: 'Salary' },
        { value: 30, color: '#AF52DE', text: 'Freelance' },
        { value: 10, color: '#5AC8FA', text: 'Other' },
      ];

  return (
    <View style={styles.container}>
      <PieChart data={data} showText textSize={14} textColor="#fff" radius={80} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
});
