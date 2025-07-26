import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Dimensions,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from "react-native";
import { BarChart } from "react-native-chart-kit";
import { onAuthStateChanged } from "firebase/auth";
import axios from "axios";
import { auth } from "../../auth/firebase";
import { useFocusEffect } from "expo-router";
import Constants from "expo-constants";
import { getStoredToken } from "@/utils/storage";

const screenWidth = Dimensions.get("window").width - 32;

export default function ExpenseChart() {
  const [chartLabels, setChartLabels] = useState<string[]>([]);
  const [chartData, setChartData] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true; // guard flag

      const fetchData = async (idToken: string) => {
        setLoading(true);
        try {
          const res = await axios.get(
            `${Constants.expoConfig?.extra?.Basic_URL}/api/v1/expense/getAll/?limit=10&page=1`,
            { headers: { Authorization: `Bearer ${idToken}` } }
          );

          const categoryTotals: Record<string, number> = {};
          res.data.data.forEach((item: any) => {
            const category = item.category;
            const amount = parseFloat(item.amount);
            categoryTotals[category] = (categoryTotals[category] || 0) + amount;
          });

          const sortedCategories = Object.entries(categoryTotals).sort(
            (a, b) => b[1] - a[1]
          );

          if (isMounted) {
            setChartLabels(sortedCategories.map(([category]) => category));
            setChartData(sortedCategories.map(([_, total]) => total));
          }
        } catch (err: any) {
          if (isMounted) setError(err.message || "Error fetching data");
        } finally {
          if (isMounted) setLoading(false);
        }
      };

      const fetchTokenAndData = async () => {
        const idToken = await getStoredToken();
        if (idToken) {
          fetchData(idToken);
        } else {
          setError("No token found");
          setLoading(false);
        }
      };

      fetchTokenAndData();

      return () => {
        isMounted = false;
      };
    }, [])
  );

  if (loading) {
    return <ActivityIndicator size="large" color="#EF4444" />;
  }

  if (error) {
    return <Text style={styles.error}>{error}</Text>;
  }

  return (
    <ScrollView horizontal>
      <BarChart
        data={{
          labels: chartLabels,
          datasets: [{ data: chartData }],
        }}
        width={Math.max(screenWidth, chartLabels.length * 60)}
        height={240}
        fromZero
        yAxisLabel="$"
        showValuesOnTopOfBars
        withInnerLines={false}
        chartConfig={{
          backgroundGradientFrom: "#fff",
          backgroundGradientTo: "#fff",
          fillShadowGradient: "#EF4444",
          fillShadowGradientOpacity: 1,
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          propsForBackgroundLines: { stroke: "#e3e3e3" },
          barPercentage: 0.5,
        }}
        style={{ borderRadius: 12 }}
        yAxisSuffix={""}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  error: { color: "red", fontSize: 16 },
});
