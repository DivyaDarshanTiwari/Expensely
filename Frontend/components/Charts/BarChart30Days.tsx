import React from "react";
import { View } from "react-native";
import { BarChart } from "react-native-gifted-charts";

export default function BarChart30Days() {
  const data = [
    { value: 500, label: "D1" },
    { value: 700, label: "D2" },
    { value: 400, label: "D3" },
    { value: 900, label: "D4" },
    { value: 650, label: "D5" },
  ];

  return (
    <View>
      <BarChart data={data} barWidth={22} frontColor="#f44336" />
    </View>
  );
}
