import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from "react-native";
import axios from "axios";
import { BarChart } from "react-native-gifted-charts";
import Constants from "expo-constants";
import { getStoredToken } from "@/utils/storage";
import { useSelector } from "react-redux";

const screenWidth = Dimensions.get("window").width - 32;

export default function IncomeChart() {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refreshCount = useSelector(
    (state: any) => state.dashboard.refreshCount
  );

  useEffect(() => {
    let isMounted = true; // to prevent state updates if unmounted

    const fetchData = async (idToken: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(
          `${Constants.expoConfig?.extra?.Basic_URL}/api/v1/income/getAll/?limit=100&page=1`,
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

        const transformedData = sortedCategories.map(([category, total]) => ({
          label: category,
          value: total,
          frontColor: "#10B981",
        }));

        if (isMounted) {
          setChartData(transformedData);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Error fetching income data.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const fetchChart = async () => {
      setLoading(true);
      setError(null);
      try {
        const idToken = await getStoredToken();
        if (!idToken) {
          if (isMounted) {
            setError("User not logged in.");
            setLoading(false);
          }
          return;
        }
        await fetchData(idToken);
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Error fetching income data.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchChart();

    return () => {
      isMounted = false;
    };
  }, [refreshCount]);

  if (loading) return <ActivityIndicator size="large" color="#10B981" />;
  if (error) return <Text style={styles.error}>{error}</Text>;

  return (
    <ScrollView horizontal>
      <BarChart
        barWidth={32}
        data={chartData}
        height={200}
        yAxisTextStyle={{ color: "#555", fontSize: 12 }}
        yAxisLabelWidth={30}
        isAnimated
        width={Math.max(screenWidth, chartData.length * 60)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  error: { color: "red", fontSize: 16 },
});
