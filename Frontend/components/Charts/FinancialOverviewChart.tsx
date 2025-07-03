import axios from "axios";
import React, { useEffect, useState } from "react";
import { View, StyleSheet, ActivityIndicator, Text } from "react-native";
import { PieChart } from "react-native-gifted-charts";

// Default color map based on known labels
const colorMap: Record<string, string> = {
  Balance: "#844BF2",
  Expense: "#E63535",
  Income: "#13d99a",
};

export default function FinancialOverviewChart({
  type,
}: {
  type: "balance" | "income";
}) {
  type ChartItem = {
    value: number;
    text: string;
    color: string;
  };

  const [chartData, setChartData] = useState<ChartItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(
          `http://localhost:8080/api/v1/account/getFinancialOverview/1`
        );
        console.log(response);
        const rawData = response.data.data;

        // Assign color if not present using the label
        const coloredData = rawData.map((item: any) => ({
          ...item,
          color: item.color || colorMap[item.text] || "#ccc", // fallback color
        }));

        console.log(rawData);

        setChartData(coloredData);
      } catch (err: any) {
        setError(err.message || "Error fetching chart data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <View style={styles.chartRow}>
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <>
          <PieChart
            data={chartData}
            radius={80}
            showText={false}
            centerLabelComponent={() => null}
          />
          <View style={styles.legendContainer}>
            {chartData.map((item, index) => (
              <View key={index} style={styles.legendItem}>
                <View
                  style={[
                    styles.legendColorBox,
                    { backgroundColor: item.color },
                  ]}
                />
                <Text style={styles.legendLabel}>{item.text}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center", padding: 20 },
  errorText: { color: "red", fontSize: 16 },
  chartRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    flexWrap: "wrap",
  },

  legendContainer: {
    marginLeft: 20,
    justifyContent: "center",
  },

  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  legendColorBox: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },

  legendLabel: {
    fontSize: 14,
    color: "#333",
  },
});
