import React from 'react';
import { View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';

export default function PieChart60DaysIncome() {
  const data = [
    { value: 30000, color: '#2196f3', text: 'Salary' },
    { value: 10000, color: '#ff9800', text: 'Freelance' },
    { value: 5000, color: '#9c27b0', text: 'Investments' },
  ];

  return (
    <View style={{ alignItems: 'center' }}>
      <PieChart
        data={data}
        donut
        showText
        radius={80}
        innerRadius={50}
        textColor="white"
        textSize={10}
      />
    </View>
  );
}
