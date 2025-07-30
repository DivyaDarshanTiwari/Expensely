"use client";

import GroupsLoadingScreen from "@/components/loading/GroupLoadingScreen";
import { refreshInvalidToken } from "@/utils/refreshIfInvalid";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  Alert,
  Animated,
  FlatList,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";
import { getStoredToken } from "../../utils/storage";

const { width: screenWidth } = Dimensions.get("window");

// Add user type for members
interface UserType {
  user_id: string;
  username: string;
  email: string;
}

const ExpenselyGroups = () => {
  const router = useRouter();
  const [idToken, setIdToken] = useState("");
  const [isLoading, setIsLoading] = useState(true);
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
  const [deletingGroupId, setDeletingGroupId] = useState<number | null>(null);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

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
          // Get current user ID from auth service
          const authRes = await axios.post(
            `${Constants.expoConfig?.extra?.User_URL}/api/v1/auth/validToken`,
            {},
            {
              headers: {
                Authorization: `Bearer ${idToken}`,
              },
            }
          );
          const currentUserId = authRes.data.user.user_id;

          // Enhanced color palettes for different groups
          const colorPalettes = [
            ["#6366F1", "#4F46E5"], // Indigo
            ["#EC4899", "#DB2777"], // Pink
            ["#10B981", "#059669"], // Emerald
            ["#F59E0B", "#D97706"], // Amber
            ["#8B5CF6", "#7C3AED"], // Violet
            ["#EF4444", "#DC2626"], // Red
            ["#06B6D4", "#0891B2"], // Cyan
            ["#84CC16", "#65A30D"], // Lime
          ];

          const mappedGroups = res.data.map((group: any, index: number) => {
            return {
              id: group.groupid,
              name: group.name,
              description: group.description,
              members: Number.parseInt(group.member_count),
              totalBudget: Number.parseFloat(group.groupbudget),
              spent: Number.parseFloat(group.spent),
              color: colorPalettes[index % colorPalettes.length],
              icon: "people",
              isOwner: group.createdby === currentUserId, // Check if current user is the creator
              isAdmin: Boolean(group.isadmin), // Convert to boolean explicitly
            };
          });
          if (isActive) {
            setGroups(mappedGroups);
          }
        } catch (err) {
          console.error("Failed to fetch groups", err);
          if (isActive) {
            Alert.alert("Error", "Could not fetch groups from server");
          }
        }
      };

      // Fetch idToken directly from storage and then fetch groups
      const refreshAndFetch = async () => {
        setIsLoading(true);
        try {
          await refreshInvalidToken(); // will return valid token or null
          const token = await getStoredToken();
          if (token && isActive) {
            setIdToken(token);
            await fetchGroups(token);
          } else {
            console.warn("No valid token after refresh attempt");
          }

          // Add minimum loading time to prevent flashing
          await new Promise((resolve) => setTimeout(resolve, 1500));

          // Start animations
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
            Animated.timing(headerSlide, {
              toValue: 0,
              duration: 900,
              useNativeDriver: true,
            }),
            Animated.spring(fabScale, {
              toValue: 1,
              tension: 40,
              friction: 8,
              delay: 600,
              useNativeDriver: true,
            }),
          ]).start(() => {
            if (isActive) {
              setIsLoading(false);
            }
          });
        } catch (err) {
          console.error("Error refreshing and fetching groups:", err);
          if (isActive) {
            setIsLoading(false);
          }
        }
      };

      refreshAndFetch();

      return () => {
        isActive = false;
      };
    }, [refreshFlag])
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupData, setNewGroupData] = useState({
    name: "",
    description: "",
    budget: "",
  });
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserType[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<UserType[]>([]);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const headerSlide = useRef(new Animated.Value(-50)).current;
  const fabScale = useRef(new Animated.Value(0)).current;

  // Show loading screen while data is being fetched
  if (isLoading) {
    return <GroupsLoadingScreen />;
  }

  const filteredGroups = groups.filter(
    (group) =>
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const calculateProgress = (spent: any, total: any) => {
    if (total === 0 || spent === 0) return 0;
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
        refresh: "true",
      },
    });
  };

  const handleDeleteGroup = (group: any) => {
    Alert.alert(
      "Delete Group",
      `Are you sure you want to delete "${group.name}"? This action cannot be undone and will remove all expenses and data associated with this group.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => confirmDeleteGroup(group.id),
        },
      ],
      { cancelable: true }
    );
  };

  const confirmDeleteGroup = async (groupId: number) => {
    setDeletingGroupId(groupId);
    try {
      await axios.delete(
        `${Constants.expoConfig?.extra?.Group_URL}/api/v1/group/deleteGroup/${groupId}`,
        {
          data: {},
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );
      // Remove the group from local state
      setGroups((prevGroups) =>
        prevGroups.filter((group) => group.id !== groupId)
      );
      Alert.alert("Success", "Group deleted successfully!");
    } catch (error: any) {
      console.error("Error deleting group:", error);
      // Handle new backend logic
      if (error.response?.data?.actions) {
        // Creator: show options to leave or delete
        Alert.alert(
          "Group Owner Options",
          error.response.data.message ||
            "You are the group owner. What would you like to do?",
          [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text: "Leave Group",
              onPress: () =>
                confirmDeleteGroupWithAction(groupId, "leave_group"),
            },
            {
              text: "Delete Group",
              style: "destructive",
              onPress: () =>
                confirmDeleteGroupWithAction(groupId, "delete_group"),
            },
          ]
        );
      } else if (
        error.response?.data?.message ===
        "No other members to transfer ownership to. Cannot leave group."
      ) {
        Alert.alert("Error", error.response.data.message);
      } else if (error.response?.status === 403) {
        // User is not an admin, offer to leave the group instead
        Alert.alert(
          "Leave Group",
          "Only group owners and admins can delete groups. Would you like to leave this group instead?",
          [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text: "Leave Group",
              style: "destructive",
              onPress: () => confirmLeaveGroup(groupId),
            },
          ]
        );
      } else {
        Alert.alert("Error", "Failed to delete group. Please try again.");
      }
    } finally {
      setDeletingGroupId(null);
    }
  };

  const confirmDeleteGroupWithAction = async (
    groupId: number,
    action: "leave_group" | "delete_group"
  ) => {
    setDeletingGroupId(groupId);
    try {
      await axios.delete(
        `${Constants.expoConfig?.extra?.Group_URL}/api/v1/group/deleteGroup/${groupId}`,
        {
          data: { action },
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );
      setGroups((prevGroups) =>
        prevGroups.filter((group) => group.id !== groupId)
      );
      if (action === "leave_group") {
        Alert.alert(
          "Success",
          "Ownership transferred and you have left the group."
        );
      } else {
        Alert.alert("Success", "Group deleted successfully!");
      }
    } catch (error: any) {
      console.error("Error with group owner action:", error);
      if (error.response?.data?.message) {
        Alert.alert("Error", error.response.data.message);
      } else {
        Alert.alert(
          "Error",
          "Failed to process your request. Please try again."
        );
      }
    } finally {
      setDeletingGroupId(null);
    }
  };

  const confirmLeaveGroup = async (groupId: number) => {
    setDeletingGroupId(groupId);
    try {
      await axios.delete(
        `${Constants.expoConfig?.extra?.Group_URL}/api/v1/group/leaveGroup/${groupId}`,
        {
          data: {},
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );
      setGroups((prevGroups) =>
        prevGroups.filter((group) => group.id !== groupId)
      );
      Alert.alert("Success", "You have left the group successfully!");
    } catch (error: any) {
      console.error("Error leaving group:", error);
      if (
        error.response?.data?.message ===
        "You must settle all your balances before leaving the group."
      ) {
        Alert.alert("Settle Up Required", error.response.data.message);
      } else if (
        error.response?.status === 400 &&
        error.response?.data?.action === "delete_group"
      ) {
        // User is the owner, they need to delete instead
        Alert.alert(
          "Delete Group",
          "Group owners cannot leave their own group. Would you like to delete the group instead?",
          [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text: "Delete Group",
              style: "destructive",
              onPress: () => confirmDeleteGroup(groupId),
            },
          ]
        );
      } else if (error.response?.data?.message) {
        Alert.alert("Error", error.response.data.message);
      } else {
        Alert.alert("Error", "Failed to leave group. Please try again.");
      }
    } finally {
      setDeletingGroupId(null);
    }
  };

  const handleLeaveGroup = (group: any) => {
    Alert.alert(
      "Leave Group",
      `Are you sure you want to leave "${group.name}"? You will no longer have access to this group's expenses and data.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Leave Group",
          style: "destructive",
          onPress: () => confirmLeaveGroup(group.id),
        },
      ],
      { cancelable: true }
    );
  };

  const handleGroupLongPress = (group: any) => {
    if (group.isAdmin) {
      // User is an admin (creator or admin) - can delete the group or leave
      Alert.alert(
        "Group Admin Options",
        `What would you like to do with "${group.name}"?`,
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Delete Group",
            style: "destructive",
            onPress: () => handleDeleteGroup(group),
          },
        ]
      );
    } else {
      // User is not an admin (regular member) - can only leave the group
      Alert.alert(
        "Group Options",
        `What would you like to do with "${group.name}"?`,
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Leave Group",
            style: "destructive",
            onPress: () => handleLeaveGroup(group),
          },
        ]
      );
    }
  };

  const searchUsers = async (query: string) => {
    if (query.trim().length < 2) return setSearchResults([]);
    try {
      const res = await axios.get(
        `${Constants.expoConfig?.extra?.Group_URL}/api/v1/users/search?q=${query}`,
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );
      const existingIds = selectedMembers.map((m) => m.user_id);
      const filtered = (res.data as UserType[]).filter(
        (user) => !existingIds.includes(user.user_id)
      );
      setSearchResults(filtered);
    } catch (err) {
      console.error("Search failed", err);
    }
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

    setIsCreatingGroup(true);

    try {
      const membersArray = selectedMembers.map((m) => m.user_id);
      const groupData = {
        name: newGroupData.name,
        groupBudget: Number.parseFloat(newGroupData.budget),
        description: newGroupData.description || "No description",
        groupMembers: membersArray,
      };

      await axios.post(
        `${Constants.expoConfig?.extra?.Group_URL}/api/v1/group/createGroup`,
        groupData,
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      // Reset all modal states
      setNewGroupData({
        name: "",
        description: "",
        budget: "",
      });
      setSelectedMembers([]);
      setMemberSearchQuery("");
      setSearchResults([]);
      setShowCreateModal(false);

      // Refresh the groups list
      setRefreshFlag((prev) => !prev);

      Alert.alert("Success", "Group created successfully!");
    } catch (error) {
      console.error("Error creating group:", error);
      Alert.alert("Error", "Failed to create group. Please try again.");
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const renderGroupCard = ({ item, index }: { item: any; index: any }) => {
    const progress = calculateProgress(item.spent, item.totalBudget);
    const progressColor = getProgressColor(progress);
    const isDeleting = deletingGroupId === item.id;

    return (
      <Animated.View
        style={[
          styles.groupCard,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 50],
                  outputRange: [0, index * 15],
                  extrapolate: "clamp",
                }),
              },
              { scale: fadeAnim },
            ],
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handleGroupSelect(item)}
          onLongPress={() => handleGroupLongPress(item)}
          style={styles.groupCardTouchable}
          disabled={isDeleting}
        >
          <LinearGradient
            colors={["#FFFFFF", "#FEFEFE"]}
            style={[
              styles.groupCardGradient,
              isDeleting && styles.groupCardDeleting,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Subtle top accent */}
            <LinearGradient
              colors={[item.color[0], item.color[1]]}
              style={styles.cardAccent}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />

            {/* Delete Loading Overlay */}
            {isDeleting && (
              <View style={styles.deleteOverlay}>
                <View style={styles.deleteLoadingContainer}>
                  <Animated.View
                    style={[
                      styles.deleteSpinner,
                      {
                        transform: [
                          {
                            rotate: fadeAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: ["0deg", "360deg"],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <Ionicons name="trash" size={24} color="#EF4444" />
                  </Animated.View>
                  <Text style={styles.deleteLoadingText}>
                    {item.isAdmin ? "Deleting..." : "Leaving..."}
                  </Text>
                </View>
              </View>
            )}

            {/* Header */}
            <View style={styles.groupCardHeader}>
              <View style={styles.groupIconContainer}>
                <LinearGradient
                  colors={[`${item.color[0]}15`, `${item.color[1]}10`]}
                  style={styles.groupIconBackground}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <LinearGradient
                    colors={item.color}
                    style={styles.groupIcon}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name={item.icon} size={22} color="white" />
                  </LinearGradient>
                </LinearGradient>
              </View>
              <View style={styles.groupInfo}>
                <View style={styles.groupTitleRow}>
                  <Text style={styles.groupName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {item.isOwner && (
                    <View style={styles.ownerBadge}>
                      <Ionicons name="star" size={12} color="#F59E0B" />
                    </View>
                  )}
                </View>
                <Text style={styles.groupDescription} numberOfLines={1}>
                  {item.description}
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: item.isAdmin ? "#FEF2F2" : "#FEF7F0" },
                ]}
                onPress={() =>
                  item.isAdmin
                    ? handleDeleteGroup(item)
                    : handleLeaveGroup(item)
                }
                disabled={isDeleting}
              >
                <Ionicons
                  name={item.isAdmin ? "trash-outline" : "exit-outline"}
                  size={16}
                  color={item.isAdmin ? "#EF4444" : "#F59E0B"}
                />
              </TouchableOpacity>
            </View>

            {/* Enhanced Stats */}
            <View style={styles.groupStats}>
              <View style={styles.statItem}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="people-outline" size={14} color="#6B7280" />
                </View>
                <Text style={styles.statValue}>{item.members}</Text>
                <Text style={styles.statLabel}>Members</Text>
              </View>
              <View style={styles.statItem}>
                <View style={styles.statIconContainer}>
                  <Ionicons
                    name="wallet-outline"
                    size={14}
                    color={item.color[0]}
                  />
                </View>
                <Text style={[styles.statValue, { color: item.color[0] }]}>
                  ₹{item.totalBudget.toLocaleString()}
                </Text>
                <Text style={styles.statLabel}>Budget</Text>
              </View>
              <View style={styles.statItem}>
                <View style={styles.statIconContainer}>
                  <Ionicons
                    name="card-outline"
                    size={14}
                    color={progressColor}
                  />
                </View>
                <Text style={[styles.statValue, { color: progressColor }]}>
                  ₹{item.spent.toLocaleString()}
                </Text>
                <Text style={styles.statLabel}>Spent</Text>
              </View>
            </View>

            {/* Enhanced Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Budget Usage</Text>
                <Text
                  style={[styles.progressPercentage, { color: progressColor }]}
                >
                  {progress.toFixed(0)}%
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View style={styles.progressTrack}>
                  <Animated.View
                    style={[
                      styles.progressFill,
                      {
                        width: progress > 0 ? `${progress}%` : 0,
                      },
                    ]}
                  >
                    {progress > 0 && (
                      <LinearGradient
                        colors={[progressColor, `${progressColor}CC`]}
                        style={StyleSheet.absoluteFill}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      />
                    )}
                  </Animated.View>
                </View>
              </View>
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
          {/* Enhanced Modal Header */}
          <LinearGradient
            colors={["#FFFFFF", "#FAFBFF"]}
            style={styles.modalHeader}
          >
            <View style={styles.modalTitleContainer}>
              <View style={styles.modalIconContainer}>
                <LinearGradient
                  colors={["#6366F1", "#8B5CF6"]}
                  style={styles.modalIcon}
                >
                  <Ionicons name="add" size={20} color="white" />
                </LinearGradient>
              </View>
              <Text style={styles.modalTitle}>Create New Group</Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowCreateModal(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView
            style={styles.modalForm}
            showsVerticalScrollIndicator={false}
          >
            {/* Enhanced Input Fields */}
            <View style={styles.modalInputContainer}>
              <Text style={styles.modalInputLabel}>
                <Ionicons name="bookmark-outline" size={14} color="#6366F1" />{" "}
                Group Name
              </Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter a memorable group name"
                  placeholderTextColor="#9CA3AF"
                  value={newGroupData.name}
                  onChangeText={(text) =>
                    setNewGroupData((prev) => ({ ...prev, name: text }))
                  }
                />
              </View>
            </View>

            <View style={styles.modalInputContainer}>
              <Text style={styles.modalInputLabel}>
                <Ionicons
                  name="document-text-outline"
                  size={14}
                  color="#6366F1"
                />{" "}
                Description (Optional)
              </Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.modalInput, { minHeight: 60 }]}
                  placeholder="What's this group for?"
                  placeholderTextColor="#9CA3AF"
                  value={newGroupData.description}
                  onChangeText={(text) =>
                    setNewGroupData((prev) => ({ ...prev, description: text }))
                  }
                  multiline
                  textAlignVertical="top"
                />
              </View>
            </View>

            <View style={styles.modalInputContainer}>
              <Text style={styles.modalInputLabel}>
                <Ionicons name="wallet-outline" size={14} color="#6366F1" />{" "}
                Budget Amount
              </Text>
              <View style={[styles.inputWrapper, styles.budgetInputWrapper]}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={[styles.modalInput, styles.budgetInput]}
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  value={newGroupData.budget}
                  onChangeText={(text) =>
                    setNewGroupData((prev) => ({ ...prev, budget: text }))
                  }
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Enhanced Members Section */}
            <View style={styles.membersSection}>
              <View style={styles.membersSectionHeader}>
                <View style={styles.membersTitleContainer}>
                  <LinearGradient
                    colors={["#6366F1", "#8B5CF6"]}
                    style={styles.membersIcon}
                  >
                    <Ionicons name="people-outline" size={16} color="white" />
                  </LinearGradient>
                  <Text style={styles.membersSectionTitle}>Add Members</Text>
                </View>
                <View style={styles.membersCount}>
                  <Text style={styles.membersCountText}>
                    {selectedMembers.length}
                  </Text>
                </View>
              </View>

              {/* Enhanced Search Input */}
              <View style={styles.memberSearchContainer}>
                <View style={styles.memberSearchInputWrapper}>
                  <Ionicons
                    name="search-outline"
                    size={18}
                    color="#9CA3AF"
                    style={styles.memberSearchIcon}
                  />
                  <TextInput
                    style={styles.memberSearchInput}
                    placeholder="Search by name or email..."
                    placeholderTextColor="#9CA3AF"
                    value={memberSearchQuery}
                    onChangeText={(text) => {
                      setMemberSearchQuery(text);
                      searchUsers(text);
                    }}
                  />
                  {memberSearchQuery.length > 0 && (
                    <TouchableOpacity
                      onPress={() => {
                        setMemberSearchQuery("");
                        setSearchResults([]);
                      }}
                      style={styles.clearSearchButton}
                    >
                      <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Enhanced Search Results */}
                {searchResults.length > 0 && (
                  <View style={styles.searchResultsContainer}>
                    <ScrollView
                      style={styles.searchResultsList}
                      nestedScrollEnabled
                    >
                      {searchResults.map((item) => (
                        <TouchableOpacity
                          key={item.user_id}
                          onPress={() => {
                            setSelectedMembers([...selectedMembers, item]);
                            setSearchResults([]);
                            setMemberSearchQuery("");
                          }}
                          style={styles.searchResultItem}
                        >
                          <LinearGradient
                            colors={["#6366F1", "#8B5CF6"]}
                            style={styles.searchResultAvatar}
                          >
                            <Text style={styles.searchResultAvatarText}>
                              {item.username.charAt(0).toUpperCase()}
                            </Text>
                          </LinearGradient>
                          <View style={styles.searchResultInfo}>
                            <Text style={styles.searchResultName}>
                              {item.username}
                            </Text>
                            <Text style={styles.searchResultEmail}>
                              {item.email}
                            </Text>
                          </View>
                          <View style={styles.addMemberButton}>
                            <Ionicons
                              name="add-circle"
                              size={20}
                              color="#10B981"
                            />
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Enhanced Selected Members */}
              {selectedMembers.length > 0 && (
                <View style={styles.selectedMembersContainer}>
                  <Text style={styles.selectedMembersTitle}>
                    Selected Members ({selectedMembers.length})
                  </Text>
                  <View style={styles.selectedMembersList}>
                    {selectedMembers.map((member: UserType) => (
                      <View
                        key={member.user_id}
                        style={styles.selectedMemberItem}
                      >
                        <LinearGradient
                          colors={["#10B981", "#059669"]}
                          style={styles.selectedMemberAvatar}
                        >
                          <Text style={styles.selectedMemberAvatarText}>
                            {member.username.charAt(0).toUpperCase()}
                          </Text>
                        </LinearGradient>
                        <View style={styles.selectedMemberInfo}>
                          <Text style={styles.selectedMemberName}>
                            {member.username}
                          </Text>
                          <Text style={styles.selectedMemberEmail}>
                            {member.email}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() =>
                            setSelectedMembers(
                              selectedMembers.filter(
                                (m) => m.user_id !== member.user_id
                              )
                            )
                          }
                          style={styles.removeMemberButton}
                        >
                          <Ionicons name="close" size={14} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Enhanced Empty State */}
              {selectedMembers.length === 0 &&
                memberSearchQuery.length === 0 && (
                  <View style={styles.emptyMembersState}>
                    <LinearGradient
                      colors={["#F3F4F6", "#E5E7EB"]}
                      style={styles.emptyStateIcon}
                    >
                      <Ionicons
                        name="person-add-outline"
                        size={24}
                        color="#9CA3AF"
                      />
                    </LinearGradient>
                    <Text style={styles.emptyMembersText}>
                      Start typing to search for members
                    </Text>
                    <Text style={styles.emptyMembersSubtext}>
                      You can add members by name or email
                    </Text>
                  </View>
                )}
            </View>
          </ScrollView>

          {/* Enhanced Modal Buttons */}
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowCreateModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalCreateButton,
                isCreatingGroup && styles.modalCreateButtonDisabled,
              ]}
              onPress={handleCreateGroup}
              disabled={isCreatingGroup}
            >
              <LinearGradient
                colors={["#6366F1", "#8B5CF6"]}
                style={styles.modalCreateGradient}
              >
                {isCreatingGroup ? (
                  <>
                    <Animated.View
                      style={{
                        transform: [
                          {
                            rotate: fadeAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: ["0deg", "360deg"],
                            }),
                          },
                        ],
                        marginRight: 6,
                      }}
                    >
                      <Ionicons name="refresh" size={18} color="white" />
                    </Animated.View>
                    <Text style={styles.modalCreateText}>Creating...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons
                      name="add"
                      size={18}
                      color="white"
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.modalCreateText}>Create Group</Text>
                  </>
                )}
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

      {/* Enhanced Header with Gradient */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: headerSlide }],
          },
        ]}
      >
        <LinearGradient
          colors={["#FFFFFF", "#FEFEFE"]}
          style={styles.headerGradient}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={22} color="#1F2937" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>My Groups</Text>
            <Text style={styles.headerSubtitle}>
              {groups.length} {groups.length === 1 ? "group" : "groups"}
            </Text>
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="options-outline" size={20} color="#6B7280" />
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>

      {/* Enhanced Search Bar */}
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
            size={18}
            color="#9CA3AF"
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
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
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

      {/* Enhanced Floating Action Button */}
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
            colors={["#6366F1", "#8B5CF6"]}
            style={styles.fabGradient}
          >
            <Ionicons name="add" size={24} color="white" />
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
    backgroundColor: "#F8FAFC",
  },
  header: {
    overflow: "hidden",
  },
  headerGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F2937",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
    fontWeight: "500",
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 50,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1F2937",
    fontWeight: "400",
  },
  clearButton: {
    padding: 4,
  },
  groupsList: {
    padding: 20,
    paddingBottom: 100,
  },
  separator: {
    height: 16,
  },
  groupCard: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  groupCardTouchable: {
    flex: 1,
  },
  groupCardGradient: {
    padding: 24,
    position: "relative",
  },
  cardAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  groupCardDeleting: {
    opacity: 0.7,
  },
  deleteOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    borderRadius: 20,
  },
  deleteLoadingContainer: {
    alignItems: "center",
  },
  deleteSpinner: {
    marginBottom: 12,
  },
  deleteLoadingText: {
    fontSize: 16,
    color: "#EF4444",
    fontWeight: "600",
  },
  groupCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  groupIconContainer: {
    marginRight: 16,
  },
  groupIconBackground: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  groupIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  groupInfo: {
    flex: 1,
  },
  groupTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  groupName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    flex: 1,
    letterSpacing: -0.3,
  },
  ownerBadge: {
    marginLeft: 8,
    padding: 4,
  },
  groupDescription: {
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 20,
    fontWeight: "400",
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  groupStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statIconContainer: {
    marginBottom: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontWeight: "600",
  },
  progressContainer: {
    paddingHorizontal: 4,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "600",
  },
  progressPercentage: {
    fontSize: 13,
    fontWeight: "700",
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressTrack: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    borderRadius: 4,
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
    minWidth: 8,
  },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,
  },
  fabButton: {
    borderRadius: 32,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  fabGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 24,
    width: "100%",
    maxWidth: 420,
    maxHeight: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalIconContainer: {
    marginRight: 12,
  },
  modalIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    letterSpacing: -0.3,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
  },
  modalForm: {
    padding: 24,
    maxHeight: 500,
  },
  modalInputContainer: {
    marginBottom: 24,
  },
  modalInputLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  inputWrapper: {
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    backgroundColor: "#FAFBFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  modalInput: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    color: "#1F2937",
    fontWeight: "400",
  },
  budgetInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6366F1",
    paddingLeft: 18,
  },
  budgetInput: {
    paddingLeft: 8,
  },
  membersSection: {
    marginBottom: 20,
  },
  membersSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  membersTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  membersIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  membersSectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
  },
  membersCount: {
    backgroundColor: "#EEF2FF",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 32,
    alignItems: "center",
  },
  membersCountText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6366F1",
  },
  memberSearchContainer: {
    marginBottom: 20,
  },
  memberSearchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAFBFF",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
    height: 48,
  },
  memberSearchIcon: {
    marginRight: 12,
  },
  memberSearchInput: {
    flex: 1,
    fontSize: 15,
    color: "#1F2937",
  },
  clearSearchButton: {
    padding: 6,
  },
  searchResultsContainer: {
    marginTop: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    maxHeight: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchResultsList: {
    maxHeight: 200,
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },
  searchResultAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  searchResultAvatarText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2,
  },
  searchResultEmail: {
    fontSize: 13,
    color: "#6B7280",
  },
  addMemberButton: {
    padding: 4,
  },
  selectedMembersContainer: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  selectedMembersTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  selectedMembersList: {
    gap: 10,
  },
  selectedMemberItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedMemberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  selectedMemberAvatarText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  selectedMemberInfo: {
    flex: 1,
  },
  selectedMemberName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2,
  },
  selectedMemberEmail: {
    fontSize: 12,
    color: "#6B7280",
  },
  removeMemberButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyMembersState: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  emptyStateIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  emptyMembersText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 12,
    textAlign: "center",
  },
  emptyMembersSubtext: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 6,
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    padding: 24,
    paddingTop: 0,
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  modalCreateButton: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modalCreateGradient: {
    paddingVertical: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  modalCreateText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  modalCreateButtonDisabled: {
    opacity: 0.7,
  },
});

export default ExpenselyGroups;
