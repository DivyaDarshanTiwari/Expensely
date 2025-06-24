import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

export default function ExpenseChart() {
  const data = [
    { value: 300, label: 'Day 1', frontColor: '#FF3B30' },
    { value: 450, label: 'Day 5', frontColor: '#FF3B30' },
    { value: 200, label: 'Day 10', frontColor: '#FF3B30' },
    { value: 500, label: 'Day 15', frontColor: '#FF3B30' },
  ];

  return (
    <View style={styles.container}>
      <BarChart data={data} barWidth={22} spacing={16} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
});
