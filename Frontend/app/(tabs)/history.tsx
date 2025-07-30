"use client";

import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import Constants from "expo-constants";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ExpenseItem from "../../components/Expense/ExpenseList";
import IncomeItem from "../../components/Income/IncomeList";
import { getStoredToken } from "../../utils/storage";
import { refreshInvalidToken } from "@/utils/refreshIfInvalid";

const { width: screenWidth } = Dimensions.get("window");

type ViewType = "expenses" | "income";

interface PaginationState {
  expenses: {
    page: number;
    hasMore: boolean;
    loading: boolean;
    showAll: boolean;
    total_records?: number;
  };
  income: {
    page: number;
    hasMore: boolean;
    loading: boolean;
    showAll: boolean;
    total_records?: number;
  };
}

const FinancialOverview = () => {
  const router = useRouter();
  const { groupId, groupName } = useLocalSearchParams();

  const [currentView, setCurrentView] = useState<ViewType>("expenses");
  const [expenseData, setExpenseData] = useState<any[]>([]);
  const [incomeData, setIncomeData] = useState<any[]>([]);
  const [idToken, setIdToken] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    expenses: { page: 1, hasMore: true, loading: false, showAll: false },
    income: { page: 1, hasMore: true, loading: false, showAll: false },
  });

  const PAGE_SIZE = 20;

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const headerSlide = useRef(new Animated.Value(-50)).current;
  const toggleSlide = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const checkAndFetchData = async () => {
        await refreshInvalidToken();
        const token = await getStoredToken();
        if (token && isActive) {
          setIdToken(token);
          // Load initial data (last 5 entries)
          fetchExpenses(token, 1, 5, true);
          fetchIncome(token, 1, 5, true);
        } else if (isActive) {
          Alert.alert("Error", "Please log in to continue");
          router.back();
        }
      };

      checkAndFetchData();

      // Start animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(headerSlide, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ]).start();

      return () => {
        isActive = false;
      };
    }, [])
  );

  const fetchExpenses = async (
    token: string,
    page: number,
    limit: number = PAGE_SIZE,
    isInitial = false
  ) => {
    setPagination((prev) => ({
      ...prev,
      expenses: { ...prev.expenses, loading: true },
    }));
    try {
      const { data } = await axios.get(
        `${Constants.expoConfig?.extra?.Basic_URL}/api/v1/expense/getAll`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { page, limit },
        }
      );
      const mappedData = data.data.map((item: any) => ({
        ...item,
        id: item.expenseid,
      }));
      const hasMore = data.pagination.next_page !== null;
      setExpenseData((prev) =>
        isInitial ? mappedData : [...prev, ...mappedData]
      );
      setPagination((prev) => ({
        ...prev,
        expenses: {
          ...prev.expenses,
          page,
          hasMore,
          loading: false,
          total_records: data.pagination.total_records,
        },
      }));
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to fetch expenses");
      setPagination((prev) => ({
        ...prev,
        expenses: { ...prev.expenses, loading: false },
      }));
    }
  };

  const fetchIncome = async (
    token: string,
    page: number,
    limit: number = PAGE_SIZE,
    isInitial = false
  ) => {
    setPagination((prev) => ({
      ...prev,
      income: { ...prev.income, loading: true },
    }));
    try {
      const { data } = await axios.get(
        `${Constants.expoConfig?.extra?.Basic_URL}/api/v1/income/getAll`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { page, limit },
        }
      );
      const mappedData = data.data.map((item: any) => ({
        id: item.incomeid,
        amount: parseFloat(item.amount),
        description: item.description,
        category: item.category.toLowerCase(),
        createdAt: item.createdat,
      }));
      const hasMore = data.pagination.next_page !== null;
      setIncomeData((prev) =>
        isInitial ? mappedData : [...prev, ...mappedData]
      );
      setPagination((prev) => ({
        ...prev,
        income: {
          ...prev.income,
          page,
          hasMore,
          loading: false,
          total_records: data.pagination.total_records,
        },
      }));
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to fetch income");
      setPagination((prev) => ({
        ...prev,
        income: { ...prev.income, loading: false },
      }));
    }
  };

  const handleViewAll = async () => {
    const currentType = currentView;
    const typePagination = pagination[currentType];
    if (!typePagination.showAll) {
      if (currentType === "expenses") {
        fetchExpenses(idToken, 1, PAGE_SIZE, true);
      } else {
        fetchIncome(idToken, 1, PAGE_SIZE, true);
      }
      setPagination((prev) => ({
        ...prev,
        [currentType]: { ...prev[currentType], showAll: true },
      }));
    } else {
      if (currentType === "expenses") {
        fetchExpenses(idToken, 1, 5, true);
      } else {
        fetchIncome(idToken, 1, 5, true);
      }
      setPagination((prev) => ({
        ...prev,
        [currentType]: { ...prev[currentType], showAll: false },
      }));
    }
  };

  const handleLoadMore = () => {
    const currentType = currentView;
    const currentPagination = pagination[currentType];
    const nextPage = currentPagination.page + 1;
    if (currentType === "expenses") {
      fetchExpenses(idToken, nextPage, PAGE_SIZE);
    } else {
      fetchIncome(idToken, nextPage, PAGE_SIZE);
    }
  };

  const handleViewToggle = (view: ViewType) => {
    if (view !== currentView) {
      setCurrentView(view);

      // Animate toggle
      Animated.sequence([
        Animated.timing(toggleSlide, {
          toValue: view === "expenses" ? 0 : 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const renderToggleHeader = () => (
    <Animated.View
      style={[
        styles.toggleContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.toggleWrapper}>
        <Animated.View
          style={[
            styles.toggleIndicator,
            {
              transform: [
                {
                  translateX: toggleSlide.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, screenWidth * 0.4],
                  }),
                },
              ],
            },
          ]}
        />
        <TouchableOpacity
          style={[
            styles.toggleButton,
            currentView === "expenses" && styles.toggleButtonActive,
          ]}
          onPress={() => handleViewToggle("expenses")}
        >
          <Ionicons
            name="card-outline"
            size={20}
            color={currentView === "expenses" ? "#FFFFFF" : "#6B7280"}
          />
          <Text
            style={[
              styles.toggleText,
              currentView === "expenses" && styles.toggleTextActive,
            ]}
          >
            Expenses
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            currentView === "income" && styles.toggleButtonActive,
          ]}
          onPress={() => handleViewToggle("income")}
        >
          <Ionicons
            name="trending-up-outline"
            size={20}
            color={currentView === "income" ? "#FFFFFF" : "#6B7280"}
          />
          <Text
            style={[
              styles.toggleText,
              currentView === "income" && styles.toggleTextActive,
            ]}
          >
            Income
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderViewAllButton = () => {
    const currentPagination = pagination[currentView];

    return (
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={handleViewAll}
          disabled={currentPagination.loading}
        >
          <Text style={styles.viewAllText}>
            {currentPagination.showAll ? "Hide" : "View All"}
          </Text>
          <Ionicons
            name={currentPagination.showAll ? "chevron-up" : "chevron-down"}
            size={16}
            color="#8B5CF6"
          />
        </TouchableOpacity>
      </View>
    );
  };

  const renderLoadMoreButton = () => {
    const currentPagination = pagination[currentView];

    if (!currentPagination.showAll || !currentPagination.hasMore) {
      return null;
    }

    return (
      <View style={styles.loadMoreContainer}>
        <TouchableOpacity
          style={styles.loadMoreButton}
          onPress={handleLoadMore}
          disabled={currentPagination.loading}
        >
          {currentPagination.loading ? (
            <ActivityIndicator size="small" color="#8B5CF6" />
          ) : (
            <>
              <Text style={styles.loadMoreText}>Load More</Text>
              <Ionicons name="chevron-down" size={16} color="#8B5CF6" />
            </>
          )}
        </TouchableOpacity>
      </View>
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
            transform: [{ translateY: headerSlide }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Financial Overview</Text>
          <Text style={styles.headerSubtitle}>{groupName}</Text>
        </View>
        <View style={styles.headerRight} />
      </Animated.View>

      {/* Toggle Header */}
      {renderToggleHeader()}

      <FlatList
        data={currentView === "expenses" ? expenseData : incomeData}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) =>
          currentView === "expenses" ? (
            <ExpenseItem
              item={item}
              onDelete={() => fetchExpenses(idToken, 1, PAGE_SIZE, true)}
            />
          ) : (
            <IncomeItem
              item={item}
              onDelete={() => fetchIncome(idToken, 1, PAGE_SIZE, true)}
            />
          )
        }
        ListHeaderComponent={
          <>
            {renderViewAllButton()}
            <Animated.View
              style={[
                styles.listContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              {/* Optional: Animated entrance can wrap around header content here if needed */}
            </Animated.View>
          </>
        }
        ListFooterComponent={renderLoadMoreButton}
        showsVerticalScrollIndicator={false}
      />
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
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  headerRight: {
    width: 40,
  },
  toggleContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  toggleWrapper: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 4,
    position: "relative",
  },
  toggleIndicator: {
    position: "absolute",
    top: 4,
    left: 4,
    width: screenWidth * 0.4,
    height: 40,
    backgroundColor: "#8B5CF6",
    borderRadius: 8,
  },
  toggleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    zIndex: 1,
  },
  toggleButtonActive: {
    // Active styles handled by indicator
  },
  toggleText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
    marginLeft: 8,
  },
  toggleTextActive: {
    color: "#FFFFFF",
  },
  content: {
    flex: 1,
  },
  actionButtonsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8B5CF6",
    marginRight: 4,
  },
  listContainer: {
    flex: 1,
  },
  loadMoreContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: "center",
  },
  loadMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    minWidth: 120,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8B5CF6",
    marginRight: 4,
  },
});

export default FinancialOverview;
