import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../../auth/firebase";
import Constants from "expo-constants";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const ExpenselyGroups = () => {
  const router = useRouter();
  const [idToken, setIdToken] = useState("");
  const [groups, setGroups] = useState([
    {
      id: 0,
      name: "",
      description: "",
      members: 1,
      totalBudget: 0,
      spent: 0,
      color: ["", ""],
      icon: "",
      isOwner: true,
    },
  ]);
  const [refreshFlag, setRefreshFlag] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      const fetchGroups = async (idToken: string) => {
        try {
          const res = await axios.get(
            `${Constants.expoConfig?.extra?.Group_URL}/api/v1/group/getGroups`,
            {
              headers: {
                Authorization: `Bearer ${idToken}`,
              },
            }
          );

          const mappedGroups = res.data.map((group: any, index: number) => ({
            id: group.groupid,
            name: group.name,
            description: group.description,
            members: parseInt(group.member_count),
            totalBudget: parseFloat(group.groupbudget),
            spent: parseFloat(group.spent),
            color: ["#8B5CF6", "#7C3AED"],
            icon: "people",
            isOwner: true,
          }));

          setGroups(mappedGroups);
        } catch (err) {
          console.error("Failed to fetch groups", err);
          Alert.alert("Error", "Could not fetch groups from server");
        }
      };

      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          try {
            const idToken = await firebaseUser.getIdToken();
            setIdToken(idToken);
            fetchGroups(idToken);
          } catch (error) {
            console.error("Error getting ID token:", error);
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
        Animated.spring(fabScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          delay: 400,
          useNativeDriver: true,
        }),
      ]).start();

      return () => unsubscribe();
    }, [refreshFlag])
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupData, setNewGroupData] = useState({
    name: "",
    description: "",
    budget: "",
    members: "", //comma-seperated user IDs
  });

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const headerSlide = useRef(new Animated.Value(-50)).current;
  const fabScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
      Animated.spring(fabScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        delay: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const filteredGroups = groups.filter(
    (group) =>
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const calculateProgress = (spent: any, total: any) => {
    return Math.min((spent / total) * 100, 100);
  };

  const getProgressColor = (progress: any) => {
    if (progress < 50) return "#10B981";
    if (progress < 80) return "#F59E0B";
    return "#EF4444";
  };

  const handleGroupSelect = (group: any) => {
    router.push({
      pathname: "/groupDetails",

      params: {
        groupId: group.id,

        groupName: group.name,

        groupData: JSON.stringify(group), // for complex objects
      },
    });
  };

  const handleCreateGroup = async () => {
    if (!newGroupData.name.trim()) {
      Alert.alert("Error", "Please enter a group name");
      return;
    }
    if (!newGroupData.budget.trim()) {
      Alert.alert("Error", "Please enter a budget amount");
      return;
    }
    if (!newGroupData.members.trim()) {
      Alert.alert("Error", "Please enter at least one member");
      return;
    }

    try {
      const membersArray = newGroupData.members
        .split(",")
        .map((id) => parseInt(id.trim()))
        .filter((id) => !isNaN(id));
      console.log(membersArray);
      // if (!membersArray.includes(userId)) {
      //   membersArray.push(userId); // Ensure creator is included
      // }

      const groupData = {
        name: newGroupData.name,
        groupBudget: parseFloat(newGroupData.budget),
        description: newGroupData.description || "No description",
        groupMembers: membersArray,
      };

      const res = await axios.post(
        `${Constants.expoConfig?.extra?.Group_URL}/api/v1/group/createGroup`,
        groupData,
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );
      setRefreshFlag((refreshFlag) => !refreshFlag);

      Alert.alert("Success", "Group created successfully!");

      // Optionally refresh the group list here (e.g., fetchGroups())

      setShowCreateModal(false);
      setNewGroupData({
        name: "",
        description: "",
        budget: "",
        members: "",
      });
    } catch (error) {
      console.error("Error creating group:", error);
      Alert.alert("Error", "Failed to create group. Please try again.");
    }
  };

  const renderGroupCard = ({ item, index }: { item: any; index: any }) => {
    const progress = calculateProgress(item.spent, item.totalBudget);
    const progressColor = getProgressColor(progress);

    return (
      <Animated.View
        style={[
          styles.groupCard,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, index * 10],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleGroupSelect(item)}
          style={styles.groupCardTouchable}
        >
          <LinearGradient
            colors={[`${item.color[0]}10`, `${item.color[1]}05`]}
            style={styles.groupCardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Header */}
            <View style={styles.groupCardHeader}>
              <View style={styles.groupIconContainer}>
                <LinearGradient
                  colors={item.color}
                  style={styles.groupIcon}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name={item.icon} size={24} color="white" />
                </LinearGradient>
              </View>
              <View style={styles.groupInfo}>
                <View style={styles.groupTitleRow}>
                  <Text style={styles.groupName}>{item.name}</Text>
                  {item.isOwner && (
                    <View style={styles.ownerBadge}>
                      <Ionicons size={12} color="#F59E0B" />
                    </View>
                  )}
                </View>
                <Text style={styles.groupDescription}>{item.description}</Text>
              </View>
            </View>

            {/* Stats */}
            <View style={styles.groupStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{item.members}</Text>
                <Text style={styles.statLabel}>Members</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: item.color[0] }]}>
                  ${item.totalBudget.toLocaleString()}
                </Text>
                <Text style={styles.statLabel}>Budget</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: progressColor }]}>
                  ${item.spent.toLocaleString()}
                </Text>
                <Text style={styles.statLabel}>Spent</Text>
              </View>
            </View>

            {/* Progress Bar */}
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
                {progress.toFixed(0)}% used
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderCreateModal = () => (
    <Modal
      visible={showCreateModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowCreateModal(false)}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[
            styles.modalContent,
            {
              opacity: fadeAnim,
              transform: [{ scale: fabScale }],
            },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New Group</Text>
            <TouchableOpacity
              onPress={() => setShowCreateModal(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalForm}>
            <View style={styles.modalInputContainer}>
              <Text style={styles.modalInputLabel}>Group Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter group name"
                placeholderTextColor="#9CA3AF"
                value={newGroupData.name}
                onChangeText={(text) =>
                  setNewGroupData((prev) => ({ ...prev, name: text }))
                }
              />
            </View>

            <View style={styles.modalInputContainer}>
              <Text style={styles.modalInputLabel}>Description (Optional)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter group description"
                placeholderTextColor="#9CA3AF"
                value={newGroupData.description}
                onChangeText={(text) =>
                  setNewGroupData((prev) => ({ ...prev, description: text }))
                }
                multiline
              />
            </View>

            <View style={styles.modalInputContainer}>
              <Text style={styles.modalInputLabel}>Budget Amount</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter budget amount"
                placeholderTextColor="#9CA3AF"
                value={newGroupData.budget}
                onChangeText={(text) =>
                  setNewGroupData((prev) => ({ ...prev, budget: text }))
                }
                keyboardType="numeric"
              />
            </View>

            <View style={styles.modalInputContainer}>
              <Text style={styles.modalInputLabel}>
                Members (comma-separated user IDs)
              </Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 1,2,3"
                placeholderTextColor="#9CA3AF"
                value={newGroupData.members}
                onChangeText={(text) =>
                  setNewGroupData((prev) => ({ ...prev, members: text }))
                }
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowCreateModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCreateButton}
              onPress={handleCreateGroup}
            >
              <LinearGradient
                colors={["#8B5CF6", "#7C3AED"]}
                style={styles.modalCreateGradient}
              >
                <Text style={styles.modalCreateText}>Create Group</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );

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
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>My Groups</Text>
          <Text style={styles.headerSubtitle}>{groups.length} groups</Text>
        </View>
        <View style={styles.headerRight} />
      </Animated.View>

      {/* Search Bar */}
      <Animated.View
        style={[
          styles.searchContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.searchBar}>
          <Ionicons
            name="search"
            size={20}
            color="#6B7280"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search groups..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {/* Groups List */}
      <FlatList
        data={filteredGroups}
        renderItem={renderGroupCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.groupsList}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {/* Floating Action Button */}
      <Animated.View
        style={[
          styles.fab,
          {
            transform: [{ scale: fabScale }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.fabButton}
          onPress={() => setShowCreateModal(true)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["#8B5CF6", "#7C3AED"]}
            style={styles.fabGradient}
          >
            <Ionicons name="add" size={28} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {renderCreateModal()}
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
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
  },
  groupsList: {
    padding: 20,
    paddingBottom: 100,
  },
  separator: {
    height: 16,
  },
  groupCard: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  groupCardTouchable: {
    flex: 1,
  },
  groupCardGradient: {
    padding: 20,
    backgroundColor: "#FFFFFF",
  },
  groupCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  groupIconContainer: {
    marginRight: 16,
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  groupInfo: {
    flex: 1,
  },
  groupTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  groupName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
  },
  ownerBadge: {
    backgroundColor: "#FEF3C7",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  groupDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  groupStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
  groupFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lastActivity: {
    flexDirection: "row",
    alignItems: "center",
  },
  lastActivityText: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 4,
  },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,
  },
  fabButton: {
    borderRadius: 28,
    elevation: 8,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    width: "100%",
    maxWidth: 400,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
  },
  modalForm: {
    padding: 20,
  },
  modalInputContainer: {
    marginBottom: 20,
  },
  modalInputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111827",
    backgroundColor: "#F9FAFB",
  },
  modalButtons: {
    flexDirection: "row",
    padding: 20,
    paddingTop: 0,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    marginRight: 10,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  modalCreateButton: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    marginLeft: 10,
  },
  modalCreateGradient: {
    paddingVertical: 12,
    alignItems: "center",
  },
  modalCreateText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
});

export default ExpenselyGroups;
