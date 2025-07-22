import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import React, { useCallback, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../auth/firebase";
import { getStoredUserId } from "../utils/storage";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const GroupDetails = () => {
  const router = useRouter();
  const { groupId, groupName, groupData, refresh } = useLocalSearchParams();

  // Parse the group data
  const [group, setGroup] = useState(JSON.parse(groupData as string));

  const [expenses, setExpenses] = useState<any[]>([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [idToken, setIdToken] = useState("");
  const [showMembers, setShowMembers] = useState(false);
  const [backendUserId, setBackendUserId] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(group.name);
  const [editDescription, setEditDescription] = useState(group.description);
  const [editBudget, setEditBudget] = useState(group.totalBudget);
  const [saving, setSaving] = useState(false);
  const [showAllExpenses, setShowAllExpenses] = useState(false);
  const [expensesPage, setExpensesPage] = useState(1);
  const [expensesHasMore, setExpensesHasMore] = useState(false);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const headerSlide = useRef(new Animated.Value(-50)).current;
  const cardScale = useRef(new Animated.Value(0.9)).current;

  // ...

  // Update fetchGroupDetails to support pagination for expenses
  const fetchGroupDetails = async (idToken: string, userId: number, page = 1, showAll = false) => {
    try {
      // Fetch latest group info
      const groupRes = await axios.get(
        `${Constants.expoConfig?.extra?.Group_URL}/api/v1/group/getGroup/${groupId}`,
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );
      if (groupRes.data) {
        setGroup((prev: any) => ({
          ...prev,
          ...groupRes.data,
          totalBudget: groupRes.data.groupbudget,
          spent: groupRes.data.spent,
          members: groupRes.data.member_count,
        }));
      }

      // Fetch expenses (paginated if showAll)
      let expensesUrl = `${Constants.expoConfig?.extra?.Group_URL}/api/v1/groupExpense/getAll/${groupId}`;
      let params = {};
      if (showAll) {
        params = { page, limit: 20 };
      } else {
        params = { page: 1, limit: 5 };
      }
      const expensesRes = await axios.get(expensesUrl, {
        headers: { Authorization: `Bearer ${idToken}` },
        params,
      });
      if (showAll && page > 1) {
        setExpenses((prev: any) => [...prev, ...(expensesRes.data || [])]);
      } else {
        setExpenses(expensesRes.data || []);
      }
      setExpensesHasMore((expensesRes.data?.length || 0) === 20);
      setExpensesPage(page);

      // Fetch group members
      const membersRes = await axios.get(
        `${Constants.expoConfig?.extra?.Group_URL}/api/v1/group/getMembers/${groupId}`,
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );
      setMembers(membersRes.data || []);

      // Check if current user is admin
      const currentUser = membersRes.data.find(
        (member: any) => member.userId === userId
      );
      setIsAdmin(currentUser?.isAdmin || false);
    } catch (error) {
      console.error("Failed to fetch group details", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          try {
            const idToken = await firebaseUser.getIdToken();
            setIdToken(idToken);
            const storedUserId = await getStoredUserId();
            const userId = storedUserId ? Number(storedUserId) : null;
            setBackendUserId(userId);
            if (userId) {
              fetchGroupDetails(idToken, userId, 1, showAllExpenses);
            } else {
              console.error("Backend user ID not found");
              setLoading(false);
            }
          } catch (error) {
            console.error("Error getting ID token:", error);
            setLoading(false);
          }
        }
      });
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
      return () => unsubscribe();
    }, [groupId, showAllExpenses])
  );

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
        groupData: groupData,
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

  const handleViewBalances = () => {
    router.push({
      pathname: "/groupBalances",
      params: {
        groupId: group.id,
        groupName: group.name,
        groupData: groupData,
      },
    });
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      const res = await axios.put(
        `${Constants.expoConfig?.extra?.Group_URL}/api/v1/group/updateGroupInfo/${group.id}`,
        {
          name: editName,
          description: editDescription,
          groupBudget: editBudget,
          userId: backendUserId,
        },
        {
          headers: { Authorization: `Bearer ${idToken}` },
        }
      );
      Alert.alert("Success", "Group info updated successfully");
      setGroup((prev: any) => ({
        ...prev,
        name: editName,
        description: editDescription,
        totalBudget: editBudget,
      }));
      setEditModalVisible(false);
    } catch (err: any) {
      Alert.alert(
        "Error",
        err?.response?.data?.message || "Failed to update group info"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleViewAllExpenses = () => {
    setShowAllExpenses((prev) => !prev);
    setExpensesPage(1);
  };

  const handleLoadMoreExpenses = async () => {
    if (!idToken || !backendUserId) return;
    await fetchGroupDetails(idToken, backendUserId, expensesPage + 1, true);
  };

  const handleDeleteExpense = async (expenseId: number) => {
    if (!idToken || !backendUserId) return;
    Alert.alert(
      "Delete Expense",
      "Are you sure you want to delete this expense? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await axios.delete(
                `${Constants.expoConfig?.extra?.Group_URL}/api/v1/groupExpense/delete/${group.id}/${expenseId}`,
                {
                  headers: { Authorization: `Bearer ${idToken}` },
                  data: { userId: backendUserId },
                }
              );
              // Refresh expenses
              fetchGroupDetails(idToken, backendUserId, 1, showAllExpenses);
              Alert.alert("Success", "Expense deleted successfully");
            } catch (err: any) {
              Alert.alert(
                "Error",
                err?.response?.data?.message || "Failed to delete expense"
              );
            }
          },
        },
      ]
    );
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
          <Text style={[styles.expenseValue, { color: group.color[0] }]}>₹{item.amount}</Text>
          <Text style={styles.expensePaidBy}>by {item.paidby}</Text>
        </View>
        {isAdmin && (
          <TouchableOpacity
            style={{ marginLeft: 8, padding: 4 }}
            onPress={() => handleDeleteExpense(item.id)}
          >
            <Ionicons name="trash" size={20} color="#EF4444" />
          </TouchableOpacity>
        )}
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
          {item.username.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{item.username}</Text>
        <Text style={styles.memberBalance}>
          {item.balance >= 0
            ? `+₹${item.balance}`
            : `-₹${Math.abs(item.balance)}`}
        </Text>
      </View>
      {isAdmin && (
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
          onPress={() => router.replace("/groups")}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{group.name}</Text>
          <Text style={styles.headerSubtitle}>Group Details</Text>
        </View>
        {isAdmin ? (
          <TouchableOpacity
            style={styles.headerAction}
            onPress={() => setEditModalVisible(true)}
          >
            <Ionicons name="settings" size={24} color="#111827" />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerAction}>
            <Ionicons name="settings" size={24} color="#D1D5DB" />
          </View>
        )}
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
                  ₹{group.totalBudget.toLocaleString()}
                </Text>
              </View>
              <View style={styles.budgetItem}>
                <Text style={styles.budgetLabel}>Spent</Text>
                <Text style={[styles.budgetValue, { color: progressColor }]}>
                  ₹{group.spent.toLocaleString()}
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
                  ₹{remaining.toLocaleString()}
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

          {isAdmin && (
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
          )}
        </Animated.View>

        {/* View Balances Button */}
        <Animated.View
          style={[
            styles.balancesButtonContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.balancesButton}
            onPress={handleViewBalances}
          >
            <LinearGradient
              colors={group.color}
              style={styles.balancesGradient}
            >
              <Ionicons name="wallet" size={24} color="white" />
              <Text style={styles.balancesButtonText}>View Balances</Text>
            </LinearGradient>
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
            <TouchableOpacity onPress={() => setShowMembers((prev) => !prev)}>
              <Text style={[styles.sectionAction, { color: group.color[0] }]}>
                {showMembers ? "Hide" : "View All"}
              </Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={showMembers ? members : []} // Show first 3 members
            renderItem={renderMemberItem}
            keyExtractor={(item) => item.username.toString()}
            scrollEnabled={false}
            ItemSeparatorComponent={() => (
              <View style={styles.memberSeparator} />
            )}
          />
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
            <TouchableOpacity onPress={handleViewAllExpenses}>
              <Text style={[styles.sectionAction, { color: group.color[0] }]}>
                {showAllExpenses ? "Show Less" : "View All"}
              </Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={showAllExpenses ? expenses : expenses.slice(0, 3)}
            renderItem={renderExpenseItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => (
              <View style={styles.expenseSeparator} />
            )}
            ListFooterComponent={
              showAllExpenses && expensesHasMore ? (
                <TouchableOpacity onPress={handleLoadMoreExpenses} style={{ padding: 16, alignItems: 'center' }}>
                  <Text style={{ color: group.color[0], fontWeight: '600' }}>Load More</Text>
                </TouchableOpacity>
              ) : null
            }
          />
        </Animated.View>
      </ScrollView>

      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.3)",
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              padding: 24,
              borderRadius: 20,
              width: "92%",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.12,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <Text
              style={{
                fontSize: 22,
                fontWeight: "700",
                color: "#7C3AED",
                marginBottom: 18,
                textAlign: "center",
              }}
            >
              Edit Group Info
            </Text>
            <View style={{ marginBottom: 14 }}>
              <Text
                style={{
                  fontSize: 15,
                  color: "#6B7280",
                  marginBottom: 6,
                  fontWeight: "600",
                }}
              >
                Group Name
              </Text>
              <TextInput
                value={editName}
                onChangeText={setEditName}
                placeholder="Group Name"
                style={{
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  borderRadius: 10,
                  padding: 10,
                  fontSize: 16,
                  color: "#111827",
                  backgroundColor: "#F9FAFB",
                }}
              />
            </View>
            <View style={{ marginBottom: 14 }}>
              <Text
                style={{
                  fontSize: 15,
                  color: "#6B7280",
                  marginBottom: 6,
                  fontWeight: "600",
                }}
              >
                Description
              </Text>
              <TextInput
                value={editDescription}
                onChangeText={setEditDescription}
                placeholder="Description"
                style={{
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  borderRadius: 10,
                  padding: 10,
                  fontSize: 16,
                  color: "#111827",
                  backgroundColor: "#F9FAFB",
                }}
                multiline
                numberOfLines={2}
              />
            </View>
            <View style={{ marginBottom: 22 }}>
              <Text
                style={{
                  fontSize: 15,
                  color: "#6B7280",
                  marginBottom: 6,
                  fontWeight: "600",
                }}
              >
                Budget
              </Text>
              <TextInput
                value={String(editBudget)}
                onChangeText={(text) => setEditBudget(Number(text))}
                placeholder="Budget"
                keyboardType="numeric"
                style={{
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  borderRadius: 10,
                  padding: 10,
                  fontSize: 16,
                  color: "#111827",
                  backgroundColor: "#F9FAFB",
                }}
              />
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                alignItems: "center",
              }}
            >
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                disabled={saving}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 22,
                  borderRadius: 10,
                  backgroundColor: "#E5E7EB",
                  marginRight: 10,
                }}
              >
                <Text
                  style={{ color: "#6B7280", fontWeight: "600", fontSize: 16 }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveEdit}
                disabled={saving}
                style={{ borderRadius: 10, overflow: "hidden" }}
              >
                <LinearGradient
                  colors={["#8B5CF6", "#7C3AED"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 28,
                    borderRadius: 10,
                  }}
                >
                  <Text
                    style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}
                  >
                    {saving ? "Saving..." : "Save"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  balancesButtonContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  balancesButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  balancesGradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  balancesButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    marginLeft: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
  },
  modalCloseIcon: {
    padding: 8,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: "#6B7280",
  },
  balancesScrollView: {
    maxHeight: 400,
    width: "100%",
  },
  balanceSection: {
    marginBottom: 24,
  },
  balanceSectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  noBalanceText: {
    fontSize: 14,
    color: "#6B7280",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 20,
  },
  settleButton: {
    marginLeft: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#E0E7FF",
    borderRadius: 8,
  },
  remindButton: {
    marginLeft: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
  },
});

export default GroupDetails;
