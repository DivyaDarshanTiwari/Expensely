"use client";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import Constants from "expo-constants";
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
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../../auth/firebase";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// Add user type for members
interface UserType {
  user_id: string;
  username: string;
  email: string;
}

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
  const [deletingGroupId, setDeletingGroupId] = useState<number | null>(null);

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
          
          const mappedGroups = res.data.map((group: any, index: number) => ({
            id: group.groupid,
            name: group.name,
            description: group.description,
            members: Number.parseInt(group.member_count),
            totalBudget: Number.parseFloat(group.groupbudget),
            spent: Number.parseFloat(group.spent),
            color: ["#8B5CF6", "#7C3AED"],
            icon: "people",
            isOwner: group.createdby === currentUserId, // Check if current user is the creator
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
  });
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserType[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<UserType[]>([]);

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
      const response = await axios.delete(
        `${Constants.expoConfig?.extra?.Group_URL}/api/v1/group/deleteGroup`,
        {
          data: { groupId },
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
          error.response.data.message || "You are the group owner. What would you like to do?",
          [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text: "Leave Group",
              onPress: () => confirmDeleteGroupWithAction(groupId, "leave_group"),
            },
            {
              text: "Delete Group",
              style: "destructive",
              onPress: () => confirmDeleteGroupWithAction(groupId, "delete_group"),
            },
          ]
        );
      } else if (error.response?.data?.message === "No other members to transfer ownership to. Cannot leave group.") {
        Alert.alert("Error", error.response.data.message);
      } else if (error.response?.status === 403 && error.response?.data?.action === "leave_group") {
        // User is not the owner, offer to leave the group instead
        Alert.alert(
          "Leave Group",
          "Only group owners can delete groups. Would you like to leave this group instead?",
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

  const confirmDeleteGroupWithAction = async (groupId: number, action: "leave_group" | "delete_group") => {
    setDeletingGroupId(groupId);
    try {
      const response = await axios.delete(
        `${Constants.expoConfig?.extra?.Group_URL}/api/v1/group/deleteGroup`,
        {
          data: { groupId, action },
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );
      setGroups((prevGroups) =>
        prevGroups.filter((group) => group.id !== groupId)
      );
      if (action === "leave_group") {
        Alert.alert("Success", "Ownership transferred and you have left the group.");
      } else {
        Alert.alert("Success", "Group deleted successfully!");
      }
    } catch (error: any) {
      console.error("Error with group owner action:", error);
      if (error.response?.data?.message) {
        Alert.alert("Error", error.response.data.message);
      } else {
        Alert.alert("Error", "Failed to process your request. Please try again.");
      }
    } finally {
      setDeletingGroupId(null);
    }
  };

  const confirmLeaveGroup = async (groupId: number) => {
    setDeletingGroupId(groupId);
    try {
      await axios.delete(
        `${Constants.expoConfig?.extra?.Group_URL}/api/v1/group/leaveGroup`,
        {
          data: { groupId },
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
      if (error.response?.data?.message === "You must settle all your balances before leaving the group.") {
        Alert.alert("Settle Up Required", error.response.data.message);
      } else if (error.response?.status === 400 && error.response?.data?.action === "delete_group") {
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
    if (group.isOwner) {
      // User is the owner - can delete the group
      Alert.alert(
        "Group Options",
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
      // User is not the owner - can leave the group
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
    try {
      const membersArray = selectedMembers.map((m) => m.user_id);
      console.log(membersArray);
      const groupData = {
        name: newGroupData.name,
        groupBudget: Number.parseFloat(newGroupData.budget),
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
      setShowCreateModal(false);
      setNewGroupData({
        name: "",
        description: "",
        budget: "",
      });
    } catch (error) {
      console.error("Error creating group:", error);
      Alert.alert("Error", "Failed to create group. Please try again.");
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
          onLongPress={() => handleGroupLongPress(item)}
          style={styles.groupCardTouchable}
          disabled={isDeleting}
        >
          <LinearGradient
            colors={[`${item.color[0]}10`, `${item.color[1]}05`]}
            style={[
              styles.groupCardGradient,
              isDeleting && styles.groupCardDeleting,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
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
                    {item.isOwner ? "Deleting..." : "Leaving..."}
                  </Text>
                </View>
              </View>
            )}

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
                </View>
                <Text style={styles.groupDescription}>{item.description}</Text>
              </View>
              {item.isOwner && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteGroup(item)}
                  disabled={isDeleting}
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              )}
              {!item.isOwner && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleLeaveGroup(item)}
                  disabled={isDeleting}
                >
                  <Ionicons name="exit-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>

            {/* Stats */}
            <View style={styles.groupStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{item.members}</Text>
                <Text style={styles.statLabel}>Members</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: item.color[0] }]}>
                  ₹{item.totalBudget.toLocaleString()}
                </Text>
                <Text style={styles.statLabel}>Budget</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: progressColor }]}>
                  ₹{item.spent.toLocaleString()}
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

          <ScrollView style={styles.modalForm}>
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

            {/* Enhanced Members Section */}
            <View style={styles.membersSection}>
              <View style={styles.membersSectionHeader}>
                <Ionicons name="people-outline" size={20} color="#8B5CF6" />
                <Text style={styles.membersSectionTitle}>Add Members</Text>
                <View style={styles.membersCount}>
                  <Text style={styles.membersCountText}>
                    {selectedMembers.length}
                  </Text>
                </View>
              </View>

              {/* Search Input with Enhanced Styling */}
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

                {/* Search Results with Enhanced Styling */}
                {searchResults.length > 0 && (
                  <View style={styles.searchResultsContainer}>
                    <FlatList
                      data={searchResults}
                      keyExtractor={(item) => item.user_id}
                      renderItem={({ item }: { item: UserType }) => (
                        <TouchableOpacity
                          onPress={() => {
                            setSelectedMembers([...selectedMembers, item]);
                            setSearchResults([]);
                            setMemberSearchQuery("");
                          }}
                          style={styles.searchResultItem}
                        >
                          <View style={styles.searchResultAvatar}>
                            <Text style={styles.searchResultAvatarText}>
                              {item.username.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <View style={styles.searchResultInfo}>
                            <Text style={styles.searchResultName}>
                              {item.username}
                            </Text>
                            <Text style={styles.searchResultEmail}>
                              {item.email}
                            </Text>
                          </View>
                          <Ionicons
                            name="add-circle-outline"
                            size={20}
                            color="#8B5CF6"
                          />
                        </TouchableOpacity>
                      )}
                      style={styles.searchResultsList}
                      showsVerticalScrollIndicator={false}
                    />
                  </View>
                )}
              </View>

              {/* Selected Members with Enhanced Styling */}
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
                        <View style={styles.selectedMemberAvatar}>
                          <Text style={styles.selectedMemberAvatarText}>
                            {member.username.charAt(0).toUpperCase()}
                          </Text>
                        </View>
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
                          <Ionicons name="close" size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Empty State */}
              {selectedMembers.length === 0 &&
                memberSearchQuery.length === 0 && (
                  <View style={styles.emptyMembersState}>
                    <Ionicons
                      name="person-add-outline"
                      size={32}
                      color="#D1D5DB"
                    />
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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
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
    position: "relative",
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
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  deleteLoadingContainer: {
    alignItems: "center",
  },
  deleteSpinner: {
    marginBottom: 8,
  },
  deleteLoadingText: {
    fontSize: 14,
    color: "#EF4444",
    fontWeight: "600",
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
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
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
    maxHeight: "90%",
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
    maxHeight: 400,
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

  // Enhanced Members Section Styles
  membersSection: {
    marginBottom: 10,
  },
  membersSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  membersSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginLeft: 8,
    flex: 1,
  },
  membersCount: {
    backgroundColor: "#EDE9FE",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: "center",
  },
  membersCountText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8B5CF6",
  },

  // Search Input Styles
  memberSearchContainer: {
    marginBottom: 16,
  },
  memberSearchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    height: 44,
  },
  memberSearchIcon: {
    marginRight: 8,
  },
  memberSearchInput: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
  },
  clearSearchButton: {
    padding: 4,
  },

  // Search Results Styles
  searchResultsContainer: {
    marginTop: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    maxHeight: 150,
    overflow: "hidden",
  },
  searchResultsList: {
    maxHeight: 150,
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  searchResultAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#8B5CF6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  searchResultAvatarText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  searchResultEmail: {
    fontSize: 12,
    color: "#6B7280",
  },

  // Selected Members Styles
  selectedMembersContainer: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  selectedMembersTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  selectedMembersList: {
    gap: 8,
  },
  selectedMemberItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  selectedMemberAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  selectedMemberAvatarText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  selectedMemberInfo: {
    flex: 1,
  },
  selectedMemberName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 1,
  },
  selectedMemberEmail: {
    fontSize: 11,
    color: "#6B7280",
  },
  removeMemberButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
  },

  // Empty State Styles
  emptyMembersState: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  emptyMembersText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
    marginTop: 8,
    textAlign: "center",
  },
  emptyMembersSubtext: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 4,
    textAlign: "center",
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
