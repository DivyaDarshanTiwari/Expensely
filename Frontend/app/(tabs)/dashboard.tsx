import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
  StyleSheet,
  StatusBar,
  FlatList,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import FinancialOverviewChart from "@/components/Charts/FinancialOverviewChart";
import { useRouter } from "expo-router";

const router = useRouter();

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const ExpenselyDashboard = () => {
  const [totalExpense, setTotalExpense] = useState(0.0);
  const [totalIncome, setTotalIncome] = useState(0.0);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    const fetchAmounts = async () => {
      try {
        const res = await axios.get(
          "http://localhost:8080/api/v1/account/getDashboard/1"
        );
        if (res?.data?.data) {
          setTotalExpense(res.data.data.totalExpense);
          setTotalIncome(res.data.data.totalIncome);
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      }
    };
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
    ]).start();
    fetchAmounts();
  }, []);

  const summaryCards = [
    {
      id: 1,
      title: "Total Income",
      amount: `${totalIncome}`,
      icon: "trending-up",
      gradient: ["#10B981", "#059669"],
      bgGradient: ["#ECFDF5", "#D1FAE5"],
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
      title: "Balance",
      amount: `${totalIncome - totalExpense}`,
      icon: "wallet",
      gradient: ["#8B5CF6", "#7C3AED"],
      bgGradient: ["#F3E8FF", "#DDD6FE"],
    },
  ];

  const recentTransactions = [
    {
      id: 1,
      title: "Grocery Shopping",
      category: "Food & Dining",
      amount: "-$85.20",
      date: "Today",
      icon: "basket",
      color: "#EF4444",
    },
    {
      id: 2,
      title: "Salary Deposit",
      category: "Income",
      amount: "+$3,200.00",
      date: "Yesterday",
      icon: "card",
      color: "#10B981",
    },
    {
      id: 3,
      title: "Netflix Subscription",
      category: "Entertainment",
      amount: "-$15.99",
      date: "2 days ago",
      icon: "play-circle",
      color: "#EF4444",
    },
    {
      id: 4,
      title: "Freelance Payment",
      category: "Income",
      amount: "+$850.00",
      date: "3 days ago",
      icon: "briefcase",
      color: "#10B981",
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

  const renderSummaryCard = ({ item, index }: { item: any; index: any }) => {
    const inputRange = [
      (index - 1) * screenWidth * 0.85,
      index * screenWidth * 0.85,
      (index + 1) * screenWidth * 0.85,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.9, 1, 0.9],
      extrapolate: "clamp",
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.6, 1, 0.6],
      extrapolate: "clamp",
    });

    return (
      <Animated.View
        style={[
          styles.summaryCard,
          {
            transform: [{ scale }],
            opacity,
          },
        ]}
      >
        <LinearGradient
          colors={item.bgGradient}
          style={styles.cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <LinearGradient
                colors={item.gradient}
                style={styles.iconGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name={item.icon} size={24} color="white" />
              </LinearGradient>
            </View>
            <Text style={styles.cardTitle}>{item.title}</Text>
          </View>
          <Text style={[styles.cardAmount, { color: item.gradient[0] }]}>
            {item.amount}
          </Text>
        </LinearGradient>
      </Animated.View>
    );
  };

  const renderTransaction = ({ item }: { item: any }) => (
    <Animated.View style={styles.transactionItem}>
      <View
        style={[styles.transactionIcon, { backgroundColor: `${item.color}15` }]}
      >
        <Ionicons name={item.icon} size={20} color={item.color} />
      </View>
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionTitle}>{item.title}</Text>
        <Text style={styles.transactionCategory}>{item.category}</Text>
      </View>
      <View style={styles.transactionRight}>
        <Text style={[styles.transactionAmount, { color: item.color }]}>
          {item.amount}
        </Text>
        <Text style={styles.transactionDate}>{item.date}</Text>
      </View>
    </Animated.View>
  );

  const renderChartCard = ({ item }: { item: any }) => {
    const getChartType = (title: string): "balance" | "income" | null => {
      if (title === "Financial Overview") return "balance";
      if (title === "Income Chart") return "income";
      return null; // Expense chart not supported in chart component yet
    };

    const chartType = getChartType(item.title);

    return (
      <TouchableOpacity style={styles.chartCard} activeOpacity={0.8}>
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
              <Ionicons name={item.icon} size={20} color={item.gradient[0]} />
            </View>
            <View style={styles.chartCardContent}>
              <Text style={styles.chartCardTitle}>{item.title}</Text>
              <Text style={styles.chartCardSubtitle}>{item.subtitle}</Text>
            </View>
          </View>

          {/* ✅ Show actual chart */}
          <View style={{ alignItems: "center" }}>
            {chartType ? (
              <View
                style={{
                  height: 169,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <FinancialOverviewChart type={chartType} />
              </View>
            ) : (
              <View style={styles.chartPlaceholder}>
                <LinearGradient
                  colors={item.gradient}
                  style={styles.chartGradient}
                  start={{ x: 0, y: 1 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
            }}
            style={styles.profileImage}
          />
          <View style={styles.userInfo}>
            <Text style={styles.greeting}>Good Morning</Text>
            <Text style={styles.userName}>Alex Johnson</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.settingsButton}
          activeOpacity={0.7}
          onPress={() => router.push("../profile")}
        >
          <Ionicons name="settings-outline" size={24} color="#6B7280" />
        </TouchableOpacity>
      </Animated.View>

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
          <Animated.FlatList
            data={summaryCards}
            renderItem={renderSummaryCard}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToInterval={screenWidth * 0.85}
            decelerationRate="fast"
            contentContainerStyle={styles.carouselContent}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false }
            )}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(
                event.nativeEvent.contentOffset.x / (screenWidth * 0.85)
              );
              setCurrentCardIndex(index);
            }}
          />
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
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.seeAllButton}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.transactionsList}>
            {recentTransactions.map((transaction) => (
              <View key={transaction.id}>
                {renderTransaction({ item: transaction })}
              </View>
            ))}
          </View>
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
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chartsContainer}
          >
            {chartCards.map((chart) => (
              <View key={chart.id}>{renderChartCard({ item: chart })}</View>
            ))}
          </ScrollView>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileImage: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginRight: 12,
  },
  userInfo: {
    justifyContent: "center",
  },
  greeting: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "400",
  },
  userName: {
    fontSize: 18,
    color: "#111827",
    fontWeight: "600",
    marginTop: 2,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  carouselContainer: {
    marginTop: 20,
    marginBottom: 10,
  },
  carouselContent: {
    paddingHorizontal: (screenWidth - screenWidth * 0.85) / 2,
  },
  summaryCard: {
    width: screenWidth * 0.95,
    height: 160,
    marginHorizontal: 5,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  cardGradient: {
    flex: 1,
    padding: 24,
    justifyContent: "space-between",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardIconContainer: {
    marginRight: 12,
  },
  iconGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  cardAmount: {
    fontSize: 32,
    fontWeight: "700",
    marginTop: 8,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  section: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  seeAllButton: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8B5CF6",
  },
  transactionsList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F9FAFB",
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  transactionCategory: {
    fontSize: 14,
    color: "#6B7280",
  },
  transactionRight: {
    alignItems: "flex-end",
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  chartsContainer: {
    paddingLeft: 20,
    paddingRight: 10,
  },
  chartCard: {
    width: screenWidth * 0.95,
    height: 250,
    marginRight: 16,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  chartCardGradient: {
    flex: 1,
    padding: 16,
  },
  chartCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  chartIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  chartCardContent: {
    flex: 1,
  },
  chartCardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  chartCardSubtitle: {
    fontSize: 12,
    color: "#6B7280",
  },
  chartPlaceholder: {
    flex: 1,
    borderRadius: 8,
    overflow: "hidden",
  },
  chartGradient: {
    flex: 1,
    opacity: 0.3,
  },
});

export default ExpenselyDashboard;
