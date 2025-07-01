import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
} from "react-native";
import SummaryCard from "../../components/shared/SummaryCard";
import RecentTransactions from "../../components/home/RecentTransactions";
import FinancialOverviewChart from "../../components/Charts/FinancialOverviewChart";
import ExpenseList from "../../components/Expense/ExpenseList";
import ExpenseChart from "../../components/Charts/ExpenseChart";
import IncomeChart from "../../components/Charts/IncomeChart";
import IncomeList from "../../components/Income/IncomeList";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import axios from "axios";

export default function DashboardScreen() {
  const [totalExpense, setTotalExpense] = useState(0.0);
  const [totalIncome, setTotalIncome] = useState(0.0);
  const router = useRouter();

  useEffect(() => {
    const fetchAmounts = async () => {
      try {
        const response = await axios.get(
          "https://zp5k3bcx-8080.inc1.devtunnels.ms//api/v1/account/getDashboard/1"
        );
        if (response) {
          console.log(response);
          setTotalExpense(response.data.data.totalExpense);
          setTotalIncome(response.data.data.totalIncome);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchAmounts();
  }, [totalExpense, totalIncome]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Profile */}
      <View style={styles.profileContainer}>
        <Image
          source={{
            uri: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSjHNf3WkJp7E5H7BR86f5RYuPQ50iBl9_b6A&s",
          }}
          style={styles.profileImage}
        />
        <Text style={styles.profileName}>Rakshita Garg</Text>
      </View>

      {/* Summary */}
      <View style={styles.summaryRow}>
        <SummaryCard title="Total Income" amount={`₹ ${totalIncome}`} />
        <SummaryCard
          title="Balance"
          amount={`₹ ${totalIncome - totalExpense}`}
        />
        <SummaryCard title="Total Expense" amount={`₹ ${totalExpense}`} />
      </View>

      {/* Grid 1 */}
      <View style={styles.gridRow}>
        <View style={styles.gridItem}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <RecentTransactions />
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.sectionTitle}>Financial Overview</Text>
          <FinancialOverviewChart type={"balance"} />
        </View>
      </View>

      {/* Grid 2 */}
      <View style={styles.gridRow}>
        <View style={styles.gridItem}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Expenses</Text>
            <TouchableOpacity
              onPress={() => router.push("../screens/recent-expenses.tsx")}
            >
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <ExpenseList />
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.sectionTitle}>Last 30 Days Expenses</Text>
          <ExpenseChart />
        </View>
      </View>

      {/* Grid 3 */}
      <View style={styles.gridRow}>
        <View style={styles.gridItem}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Income</Text>
            <TouchableOpacity onPress={() => router.push("./income")}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <IncomeList />
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.sectionTitle}>Last 60 Days Income</Text>
          <IncomeChart />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f9f9" },
  contentContainer: { padding: 16 },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  profileImage: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  profileName: { fontSize: 20, fontWeight: "600" },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 8,
  },
  gridRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  gridItem: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  seeAll: { color: "#007AFF", fontSize: 12 },
});
