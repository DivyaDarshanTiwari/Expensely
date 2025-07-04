import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Animated,
  StyleSheet,
  StatusBar,
  FlatList,
  ScrollView,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const GroupDetails = () => {
  const router = useRouter();
  const { groupId, groupName, groupData } = useLocalSearchParams();

  // Parse the group data
  const group = JSON.parse(groupData as string);

  const [expenses, setExpenses] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const headerSlide = useRef(new Animated.Value(-50)).current;
  const cardScale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    const fetchGroupDetails = async () => {
      try {
        // Fetch recent expenses
        const expensesRes = await axios.get(
          `http://localhost:8082/api/v1/groupExpense/getAll/${groupId}`
        );
        setExpenses(expensesRes.data || []);

        // Fetch group members
        const membersRes = await axios.get(
          `http://localhost:8082/api/v1/group/getMembers/${groupId}`
        );
        setMembers(membersRes.data || []);
      } catch (error) {
        console.error("Failed to fetch group details", error);
      } finally {
        setLoading(false);
      }
    };

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
      Animated.spring(cardScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();

    fetchGroupDetails();
  }, []);

  const calculateProgress = (spent: any, total: any) => {
    return Math.min((spent / total) * 100, 100);
  };

  const getProgressColor = (progress: any) => {
    if (progress < 50) return "#10B981";
    if (progress < 80) return "#F59E0B";
    return "#EF4444";
  };

  const handleAddExpense = () => {
    router.push({
      pathname: "/addExpense",
      params: {
        groupId: group.id,
        groupName: group.name,
      },
    });
  };

  const handleManageMembers = () => {
    router.push({
      pathname: "/manageMembers",
      params: {
        groupId: group.id,
        groupName: group.name,
      },
    });
  };

  const renderExpenseItem = ({ item, index }: { item: any; index: any }) => (
    <Animated.View
      style={[
        styles.expenseCard,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, index * 5],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.expenseHeader}>
        <View style={styles.expenseIconContainer}>
          <Ionicons
            name={item.category === "food" ? "restaurant" : "card"}
            size={20}
            color={group.color[0]}
          />
        </View>
        <View style={styles.expenseInfo}>
          <Text style={styles.expenseTitle}>{item.category}</Text>
          <Text style={styles.expenseDate}>
            {new Date(item.createdat).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </Text>
        </View>
        <View style={styles.expenseAmount}>
          <Text style={[styles.expenseValue, { color: group.color[0] }]}>
            ${item.amount}
          </Text>
          <Text style={styles.expensePaidBy}>by {item.paidby}</Text>
        </View>
      </View>
    </Animated.View>
  );

  const renderMemberItem = ({ item, index }: { item: any; index: any }) => (
    <Animated.View
      style={[
        styles.memberCard,
        {
          opacity: fadeAnim,
          transform: [{ scale: cardScale }],
        },
      ]}
    >
      <View style={styles.memberAvatar}>
        <Text style={styles.memberInitial}>
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{item.name}</Text>
        <Text style={styles.memberBalance}>
          {item.balance >= 0
            ? `+$${item.balance}`
            : `-$${Math.abs(item.balance)}`}
        </Text>
      </View>
      {group.isOwner && (
        <TouchableOpacity style={styles.memberAction}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#6B7280" />
        </TouchableOpacity>
      )}
    </Animated.View>
  );

  const progress = calculateProgress(group.spent, group.totalBudget);
  const progressColor = getProgressColor(progress);
  const remaining = group.totalBudget - group.spent;

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
          onPress={() => router.replace("/(tabs)/group")}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{group.name}</Text>
          <Text style={styles.headerSubtitle}>Group Details</Text>
        </View>
        <TouchableOpacity style={styles.headerAction}>
          <Ionicons name="settings" size={24} color="#111827" />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Group Summary Card */}
        <Animated.View
          style={[
            styles.summaryCard,
            {
              opacity: fadeAnim,
              transform: [{ scale: cardScale }],
            },
          ]}
        >
          <LinearGradient
            colors={[`${group.color[0]}15`, `${group.color[1]}10`]}
            style={styles.summaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.summaryHeader}>
              <View style={styles.summaryIconContainer}>
                <LinearGradient
                  colors={group.color}
                  style={styles.summaryIcon}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name={group.icon} size={32} color="white" />
                </LinearGradient>
              </View>
              <View style={styles.summaryInfo}>
                <Text style={styles.summaryTitle}>{group.name}</Text>
                <Text style={styles.summaryDescription}>
                  {group.description}
                </Text>
              </View>
            </View>

            <View style={styles.budgetStats}>
              <View style={styles.budgetItem}>
                <Text style={styles.budgetLabel}>Total Budget</Text>
                <Text style={[styles.budgetValue, { color: group.color[0] }]}>
                  ${group.totalBudget.toLocaleString()}
                </Text>
              </View>
              <View style={styles.budgetItem}>
                <Text style={styles.budgetLabel}>Spent</Text>
                <Text style={[styles.budgetValue, { color: progressColor }]}>
                  ${group.spent.toLocaleString()}
                </Text>
              </View>
              <View style={styles.budgetItem}>
                <Text style={styles.budgetLabel}>Remaining</Text>
                <Text
                  style={[
                    styles.budgetValue,
                    { color: remaining >= 0 ? "#10B981" : "#EF4444" },
                  ]}
                >
                  ${remaining.toLocaleString()}
                </Text>
              </View>
            </View>

            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progress}%`,
                      backgroundColor: progressColor,
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {progress.toFixed(0)}% of budget used
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View
          style={[
            styles.actionsContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleAddExpense}
          >
            <LinearGradient colors={group.color} style={styles.actionGradient}>
              <Ionicons name="add" size={24} color="white" />
              <Text style={styles.actionText}>Add Expense</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleManageMembers}
          >
            <View style={styles.actionSecondary}>
              <Ionicons name="people" size={24} color={group.color[0]} />
              <Text style={[styles.actionText, { color: group.color[0] }]}>
                Manage Members
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Members Section */}
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
            <Text style={styles.sectionTitle}>Members ({group.members})</Text>
            <TouchableOpacity>
              <Text style={[styles.sectionAction, { color: group.color[0] }]}>
                View All
              </Text>
            </TouchableOpacity>
          </View>

          {/* <FlatList
            data={members.slice(0, 3)} // Show first 3 members
            renderItem={renderMemberItem}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            ItemSeparatorComponent={() => (
              <View style={styles.memberSeparator} />
            )}
          /> */}
        </Animated.View>

        {/* Recent Expenses */}
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
            <Text style={styles.sectionTitle}>Recent Expenses</Text>
            <TouchableOpacity>
              <Text style={[styles.sectionAction, { color: group.color[0] }]}>
                View All
              </Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={expenses.slice(0, 5)} // Show first 5 expenses
            renderItem={renderExpenseItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => (
              <View style={styles.expenseSeparator} />
            )}
          />
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
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  summaryCard: {
    margin: 20,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  summaryGradient: {
    padding: 24,
    backgroundColor: "#FFFFFF",
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  summaryIconContainer: {
    marginRight: 16,
  },
  summaryIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  summaryInfo: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  summaryDescription: {
    fontSize: 16,
    color: "#6B7280",
    lineHeight: 22,
  },
  budgetStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  budgetItem: {
    alignItems: "center",
  },
  budgetLabel: {
    fontSize: 12,
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  budgetValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  actionsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
    borderRadius: 16,
    overflow: "hidden",
  },
  actionGradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  actionSecondary: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  actionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    marginLeft: 8,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
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
  sectionAction: {
    fontSize: 16,
    fontWeight: "600",
  },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#8B5CF6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  memberInitial: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  memberBalance: {
    fontSize: 14,
    color: "#6B7280",
  },
  memberAction: {
    padding: 8,
  },
  memberSeparator: {
    height: 12,
  },
  expenseCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  expenseHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  expenseIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  expenseDate: {
    fontSize: 14,
    color: "#6B7280",
  },
  expenseAmount: {
    alignItems: "flex-end",
  },
  expenseValue: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  expensePaidBy: {
    fontSize: 12,
    color: "#6B7280",
  },
  expenseSeparator: {
    height: 12,
  },
});

export default GroupDetails;
