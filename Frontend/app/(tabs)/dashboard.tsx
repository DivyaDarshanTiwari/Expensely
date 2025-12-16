"use client";
import LoadingScreen from "@/components/loading/LoadingScreen";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import Constants from "expo-constants";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useEffect, useRef, useState } from "react";
import { Animated, ScrollView, StatusBar, Text, View } from "react-native";
import { useSelector } from "react-redux";
import { auth } from "../../auth/firebase";
import { getStoredToken, getStoredUser } from "../../utils/storage";
import { useHasMountedOnce } from "../../components/Dashboard/utils/useHasMountedOnce";
import { ChartCards } from "@/components/Dashboard/ChartCard";
import { DashboardHeader } from "@/components/Dashboard/DashboardHeader";
import { RecentTransactions } from "@/components/Dashboard/RecentTransactions";
import { SummaryCarousel } from "@/components/Dashboard/SummaryCarousel";
import styles from "@/components/Dashboard/styles/styles";

interface Transaction {
  id: number;
  amount: string;
  category: string;
  dayAgo: string;
  type: "income" | "expense";
  description: string;
}

const ExpenselyDashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [totalExpense, setTotalExpense] = useState(0.0);
  const [totalIncome, setTotalIncome] = useState(0.0);
  const [isLoading, setIsLoading] = useState(true);
  const scrollX = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
    []
  );
  const hasMountedOnce = useHasMountedOnce();
  const refreshCount = useSelector(
    (state: any) => state.dashboard.refreshCount
  );

  const categoryIconMap: Record<
    string,
    { icon: keyof typeof Ionicons.glyphMap; color: string; label: string }
  > = {
    Food: { icon: "restaurant", color: "#F59E0B", label: "Food" },
    Transport: { icon: "car", color: "#3B82F6", label: "Transport" },
    Entertainment: {
      icon: "game-controller",
      color: "#8B5CF6",
      label: "Entertainment",
    },
    Shopping: { icon: "bag", color: "#EC4899", label: "Shopping" },
    Utilities: { icon: "flash", color: "#10B981", label: "Utilities" },
    Health: { icon: "medical", color: "#EF4444", label: "Health" },
    General: { icon: "card", color: "#6B7280", label: "General" },
    Salary: { icon: "briefcase", color: "#10B981", label: "Salary" },
    Freelance: { icon: "laptop", color: "#3B82F6", label: "Freelance" },
    Investment: { icon: "trending-up", color: "#8B5CF6", label: "Investment" },
    Gift: { icon: "gift", color: "#EC4899", label: "Gift" },
    Refund: { icon: "refresh", color: "#F59E0B", label: "Refund" },
    Bonus: { icon: "star", color: "#EF4444", label: "Bonus" },
    Other: { icon: "cash", color: "#6B7280", label: "Other" },
    GroupExpense: { icon: "people", color: "#7C3AED", label: "Group Expense" },
    GroupSettlement: {
      icon: "swap-horizontal",
      color: "#F59E0B",
      label: "Group Settlement",
    },
  };

  useEffect(() => {
    let isActive = true;
    let unsubscribeAuth: (() => void) | null = null;

    const fetchData = async () => {
      setIsLoading(true);

      try {
        const storedToken = await getStoredToken();
        const storedUser = await getStoredUser();

        if (storedToken && isActive && storedUser) {
          try {
            setUser(storedUser);

            // Fetch dashboard data
            const dashboardRes = await axios.get(
              `${Constants.expoConfig?.extra?.Basic_URL}/api/v1/account/getDashboard`,
              { headers: { Authorization: `Bearer ${storedToken}` } }
            );

            if (dashboardRes?.data?.data) {
              setTotalExpense(dashboardRes.data.data.totalExpense || 0);
              setTotalIncome(dashboardRes.data.data.totalIncome || 0);
            }

            // Fetch merged transactions
            const transactionsRes = await axios.get(
              `${Constants.expoConfig?.extra?.Basic_URL}/api/v1/account/getMergedTransactions?page=1&limit=5`,
              { headers: { Authorization: `Bearer ${storedToken}` } }
            );

            if (transactionsRes?.data?.data) {
              setRecentTransactions(transactionsRes.data.data as Transaction[]);
            } else {
              console.error("No data returned from merged transactions API.");
              setRecentTransactions([]);
            }
          } catch (err) {
            console.error("Error during data fetch:", err);
          }
        }

        // Set up auth listener
        unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser && isActive && !storedUser) {
            setUser(firebaseUser);
          }
        });

        // Add a minimum loading time
        await new Promise((resolve) => setTimeout(resolve, 1500));

        if (!hasMountedOnce) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
              toValue: 0,
              duration: 800,
              useNativeDriver: true,
            }),
          ]).start(() => {
            if (isActive) setIsLoading(false);
          });
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Error in fetchData:", err);
        setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      isActive = false;
      if (unsubscribeAuth) unsubscribeAuth();
    };
  }, [refreshCount]); // include dispatch in deps

  // Show loading screen while data is being fetched
  if (isLoading) {
    return <LoadingScreen />;
  }

  const summaryCards = [
    {
      id: 1,
      title: "Balance",
      amount: `${totalIncome - totalExpense}`,
      icon: "wallet",
      gradient: ["#8B5CF6", "#7C3AED"],
      bgGradient: ["#F3E8FF", "#DDD6FE"],
    },
    {
      id: 2,
      title: "Total Expense",
      amount: `${totalExpense}`,
      icon: "trending-down",
      gradient: ["#EF4444", "#DC2626"],
      bgGradient: ["#FEF2F2", "#FECACA"],
    },
    {
      id: 3,
      title: "Total Income",
      amount: `${totalIncome}`,
      icon: "trending-up",
      gradient: ["#10B981", "#059669"],
      bgGradient: ["#ECFDF5", "#D1FAE5"],
    },
  ];

  const chartCards = [
    {
      id: 1,
      title: "Financial Overview",
      subtitle: "This Month",
      icon: "analytics",
      gradient: ["#8B5CF6", "#7C3AED"],
    },
    {
      id: 2,
      title: "Expense Chart",
      subtitle: "Last 30 Days",
      icon: "pie-chart",
      gradient: ["#EF4444", "#DC2626"],
    },
    {
      id: 3,
      title: "Income Chart",
      subtitle: "Last 60 Days",
      icon: "bar-chart",
      gradient: ["#10B981", "#059669"],
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />
      {/* Header */}{/* Importing the dasboard componets */}
      <DashboardHeader user={user}></DashboardHeader>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Summary Cards Carousel */}
        <Animated.View
          style={[
            styles.carouselContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <SummaryCarousel summaryCards={summaryCards} scrollX={scrollX} />
        </Animated.View>

        {/* Recent Transactions */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
          </View>

          <RecentTransactions
            transactions={recentTransactions}
            categoryIconMap={categoryIconMap}
          />
        </Animated.View>

        {/* Charts Section */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Analytics</Text>
          <ChartCards chartCards={chartCards}></ChartCards>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

export default ExpenselyDashboard;
