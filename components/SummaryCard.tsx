import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SummaryCard({ title, amount }: { title: string, amount: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.amount}>{amount}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    elevation: 2,
  },
  title: { fontSize: 14, color: '#555' },
  amount: { fontSize: 16, fontWeight: '700', color: '#333', marginTop: 4 },
});
