import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import ExpenseChart from "@/components/Charts/ExpenseChart";
import FinancialOverviewChart from "@/components/Charts/FinancialOverviewChart";
import IncomeChart from "@/components/Charts/IncomeChart";
import styles from "./styles/styles";

export const ChartCards = ({ chartCards }: any) => {
  const getChartComponent = (title: string) => {
    switch (title) {
      case "Financial Overview":
        return <FinancialOverviewChart />;
      case "Expense Chart":
        return <ExpenseChart />;
      case "Income Chart":
        return <IncomeChart />;
      default:
        return null;
    }
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chartsContainer}
    >
      {chartCards.map((item: any) => {
        const chartComponent = getChartComponent(item.title);
        return (
          <TouchableOpacity
            style={styles.chartCard}
            activeOpacity={0.5}
            key={item.id}
          >
            <LinearGradient
              colors={[`${item.gradient[0]}10`, `${item.gradient[1]}05`]}
              style={styles.chartCardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.chartCardHeader}>
                <View
                  style={[
                    styles.chartIcon,
                    { backgroundColor: `${item.gradient[0]}20` },
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={item.gradient[0]}
                  />
                </View>
                <View style={styles.chartCardContent}>
                  <Text style={styles.chartCardTitle}>{item.title}</Text>
                  <Text style={styles.chartCardSubtitle}>{item.subtitle}</Text>
                </View>
              </View>
              <View style={{ alignItems: "center" }}>{chartComponent}</View>
            </LinearGradient>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};
