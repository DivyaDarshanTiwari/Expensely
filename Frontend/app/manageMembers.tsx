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
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { auth } from "../auth/firebase";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const ManageMembers = () => {
  const router = useRouter();
  const { groupId, groupName } = useLocalSearchParams();

  const [members, setMembers] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [addMemberQuery, setAddMemberQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [idToken, setIdToken] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const headerSlide = useRef(new Animated.Value(-50)).current;
  const cardScale = useRef(new Animated.Value(0.95)).current;

  // ...

  useFocusEffect(
    useCallback(() => {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          try {
            const idToken = await firebaseUser.getIdToken();
            setIdToken(idToken);
            fetchMembers(idToken);
          } catch (error) {
            console.error("Error getting ID token:", error);
          }
        }
      });

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

      return () => unsubscribe();
    }, [])
  );

  const fetchMembers = async (idToken: string) => {
    try {
      const res = await axios.get(
        `${Constants.expoConfig?.extra?.Group_URL}/api/v1/group/getMembers/${groupId}`,
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );
      console.log(res.data);
      setMembers(res.data || []);

      // Get current user ID and check admin status
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
      setCurrentUserId(currentUserId);

      // Check if current user is admin
      const currentUser = res.data.find(
        (member: any) => member.userId === currentUserId
      );
      setIsAdmin(currentUser?.isAdmin || false);
    } catch (error) {
      console.error("Failed to fetch members", error);
      Alert.alert("Error", "Could not fetch group members");
    }
  };

  const searchUsers = async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const res = await axios.get(
        `${Constants.expoConfig?.extra?.Group_URL}/api/v1/users/search?q=${query}`,
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );
      // Filter out users who are already members
      const existingMemberIds = members.map((member) => member.userId);
      const filteredResults = res.data.filter(
        (user: any) => !existingMemberIds.includes(user.user_id)
      );
      setSearchResults(filteredResults || []);
    } catch (error) {
      console.error("Failed to search users", error);
      setSearchResults([]);
    }
  };

  const handleAddMember = async (user: any) => {
    setLoading(true);
    try {
      console.log(user);
      const res = await axios.post(
        `${Constants.expoConfig?.extra?.Group_URL}/api/v1/group/addMember/${groupId}`,
        {
          add_userId: user.user_id,
          currentUserId: currentUserId,
        },
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      Alert.alert("Success", `${user.username} has been added to the group!`);
      setShowAddModal(false);
      setAddMemberQuery("");
      setSearchResults([]);
      fetchMembers(idToken); // Refresh the members list

      setMembers((prevMembers) => [
        ...prevMembers,
        {
          userId: user.user_id,
        },
      ]);
    } catch (error) {
      console.error("Error adding member:", error);
      Alert.alert("Error", "Failed to add member. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!selectedMember) return;

    setLoading(true);
    try {
      console.log(selectedMember);
      const res = await axios.delete(
        `${Constants.expoConfig?.extra?.Group_URL}/api/v1/group/removeMember/${groupId}`,
        {
          data: {
            delete_user_id: selectedMember?.userId,
            currentUserId: currentUserId,
          },
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );
      setMembers((prevMembers) =>
        prevMembers.filter((member) => member.userId !== selectedMember?.userId)
      );

      Alert.alert(
        "Success",
        `${selectedMember.username} has been removed from the group.`
      );
      setShowRemoveModal(false);
      setSelectedMember(null);
      fetchMembers(idToken); // Refresh the members list
    } catch (error) {
      console.error("Error removing member:", error);
      Alert.alert("Error", "Failed to remove member. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleMakeAdmin = async () => {
    if (!selectedMember) return;

    setLoading(true);
    try {
      const res = await axios.post(
        `${Constants.expoConfig?.extra?.Group_URL}/api/v1/group/makeAdmin/${groupId}`,
        {
          targetUserId: selectedMember.userId,
          currentUserId: currentUserId,
        },
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      Alert.alert("Success", `${selectedMember.username} is now an admin!`);
      setShowAdminModal(false);
      setSelectedMember(null);
      fetchMembers(idToken); // Refresh the members list
    } catch (error) {
      console.error("Error making admin:", error);
      Alert.alert("Error", "Failed to make user admin. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAdmin = async () => {
    if (!selectedMember) return;

    setLoading(true);
    try {
      const res = await axios.post(
        `${Constants.expoConfig?.extra?.Group_URL}/api/v1/group/removeAdmin/${groupId}`,
        {
          targetUserId: selectedMember.userId,
          currentUserId: currentUserId,
        },
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      Alert.alert(
        "Success",
        `${selectedMember.username} is no longer an admin.`
      );
      setShowAdminModal(false);
      setSelectedMember(null);
      fetchMembers(idToken); // Refresh the members list
    } catch (error) {
      console.error("Error removing admin:", error);
      Alert.alert(
        "Error",
        "Failed to remove admin privileges. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMembers(idToken);
    setRefreshing(false);
  };

  const filteredMembers = members.filter((member) => {
    const username = member.username?.toLowerCase() || "";
    const email = member.email?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();

    return username.includes(query) || email.includes(query);
  });

  const currentUser = members.find((member) => member.userId === currentUserId);

  const getBalanceColor = (balance: any) => {
    if (balance > 0) return "#10B981"; // Green for positive
    if (balance < 0) return "#EF4444"; // Red for negative
    return "#6B7280"; // Gray for zero
  };

  const getBalanceText = (balance: any) => {
    if (balance > 0) return `+₹${balance.toFixed(2)}`;
    if (balance < 0) return `-₹${Math.abs(balance).toFixed(2)}`;
    return "₹0.00";
  };

  const renderMemberCard = ({ item, index }: { item: any; index: any }) => (
    <Animated.View
      style={[
        styles.memberCard,
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
      <View style={styles.memberHeader}>
        <View style={styles.memberAvatar}>
          <Text style={styles.memberInitial}>
            {(item.username?.charAt(0) || "?").toUpperCase()}
          </Text>
        </View>
        <View style={styles.memberInfo}>
          <View style={styles.memberNameRow}>
            <Text style={styles.memberName}>{item.username}</Text>
            {item.isAdmin && (
              <View style={styles.adminBadge}>
                <Ionicons name="shield-checkmark" size={12} color="#8B5CF6" />
                <Text style={styles.adminText}>Admin</Text>
              </View>
            )}
          </View>
          <Text style={styles.memberEmail}>{item.email}</Text>
          <View style={styles.memberStats}>
            <Text
              style={[
                styles.memberBalance,
                { color: getBalanceColor(item.balance || 0) },
              ]}
            >
              {getBalanceText(item.balance || 0)}
            </Text>
            <Text style={styles.memberStatus}>
              {item.balance > 0
                ? "Owed"
                : item.balance < 0
                  ? "Owes"
                  : "Settled"}
            </Text>
          </View>
        </View>
        {isAdmin && item.userId !== currentUserId && (
          <TouchableOpacity
            style={styles.memberAction}
            onPress={() => {
              setSelectedMember(item);
              setShowAdminModal(true);
            }}
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );

  const renderSearchResult = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.searchResultItem}
      onPress={() => handleAddMember(item)}
      disabled={loading}
    >
      <View style={styles.memberAvatar}>
        <Text style={styles.memberInitial}>
          {(item.username?.charAt(0) || "?").toUpperCase()}
        </Text>
      </View>
      <View style={styles.searchResultInfo}>
        <Text style={styles.searchResultName}>{item.username}</Text>
        <Text style={styles.searchResultEmail}>{item.email}</Text>
      </View>
      <Ionicons name="add-circle" size={24} color="#8B5CF6" />
    </TouchableOpacity>
  );

  const renderAddModal = () => (
    <Modal
      visible={showAddModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowAddModal(false)}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[styles.modalContent, { transform: [{ scale: cardScale }] }]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Member</Text>
            <TouchableOpacity
              onPress={() => {
                setShowAddModal(false);
                setAddMemberQuery("");
                setSearchResults([]);
              }}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <Ionicons
                  name="search"
                  size={20}
                  color="#6B7280"
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by name or email..."
                  placeholderTextColor="#9CA3AF"
                  value={addMemberQuery}
                  onChangeText={(text) => {
                    setAddMemberQuery(text);
                    searchUsers(text);
                  }}
                />
              </View>
            </View>

            {searchResults.length > 0 && (
              <View style={styles.searchResults}>
                <Text style={styles.searchResultsTitle}>Search Results</Text>
                <FlatList
                  data={searchResults}
                  renderItem={renderSearchResult}
                  keyExtractor={(item) => item.username}
                  style={styles.searchResultsList}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            )}

            {addMemberQuery.length >= 2 && searchResults.length === 0 && (
              <View style={styles.noResults}>
                <Ionicons name="person-add" size={48} color="#9CA3AF" />
                <Text style={styles.noResultsText}>No users found</Text>
                <Text style={styles.noResultsSubtext}>
                  Try searching with a different name or email
                </Text>
              </View>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );

  const renderRemoveModal = () => (
    <Modal
      visible={showRemoveModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowRemoveModal(false)}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[styles.modalContent, { transform: [{ scale: cardScale }] }]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Remove Member</Text>
            <TouchableOpacity
              onPress={() => {
                setShowRemoveModal(false);
                setSelectedMember(null);
              }}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <View style={styles.confirmationContent}>
              <Ionicons name="warning" size={48} color="#F59E0B" />
              <Text style={styles.confirmationTitle}>
                Remove {selectedMember?.username}?
              </Text>
              <Text style={styles.confirmationText}>
                This member will be removed from the group and will no longer
                have access to group expenses. This action cannot be undone.
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowRemoveModal(false);
                  setSelectedMember(null);
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalRemoveButton}
                onPress={handleRemoveMember}
                disabled={loading}
              >
                <Text style={styles.modalRemoveText}>
                  {loading ? "Removing..." : "Remove"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );

  const renderAdminModal = () => (
    <Modal
      visible={showAdminModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowAdminModal(false)}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[styles.modalContent, { transform: [{ scale: cardScale }] }]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Manage {selectedMember?.username}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setShowAdminModal(false);
                setSelectedMember(null);
              }}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <View style={styles.memberInfoCard}>
              <View style={styles.memberAvatar}>
                <Text style={styles.memberInitial}>
                  {(selectedMember?.username?.charAt(0) || "?").toUpperCase()}
                </Text>
              </View>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>
                  {selectedMember?.username}
                </Text>
                <Text style={styles.memberEmail}>{selectedMember?.email}</Text>
                {selectedMember?.isAdmin && (
                  <View style={styles.adminBadge}>
                    <Ionicons
                      name="shield-checkmark"
                      size={12}
                      color="#8B5CF6"
                    />
                    <Text style={styles.adminText}>Admin</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.adminActions}>
              {!selectedMember?.isAdmin ? (
                <TouchableOpacity
                  style={styles.adminActionButton}
                  onPress={handleMakeAdmin}
                  disabled={loading}
                >
                  <Ionicons name="shield-checkmark" size={20} color="#8B5CF6" />
                  <Text style={styles.adminActionText}>Make Admin</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.adminActionButton}
                  onPress={handleRemoveAdmin}
                  disabled={loading}
                >
                  <Ionicons name="shield-outline" size={20} color="#EF4444" />
                  <Text style={[styles.adminActionText, { color: "#EF4444" }]}>
                    Remove Admin
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.removeActionButton}
                onPress={() => {
                  setShowAdminModal(false);
                  setShowRemoveModal(true);
                }}
                disabled={loading}
              >
                <Ionicons name="person-remove" size={20} color="#EF4444" />
                <Text style={styles.removeActionText}>Remove from Group</Text>
              </TouchableOpacity>
            </View>
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
          <Text style={styles.headerTitle}>Manage Members</Text>
          <Text style={styles.headerSubtitle}>{groupName}</Text>
        </View>
        {isAdmin && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="person-add" size={24} color="#8B5CF6" />
          </TouchableOpacity>
        )}
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
            placeholder="Search members..."
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

      {/* Members Stats */}
      <Animated.View
        style={[
          styles.statsCard,
          {
            opacity: fadeAnim,
            transform: [{ scale: cardScale }],
          },
        ]}
      >
        <LinearGradient
          colors={["#8B5CF615", "#7C3AED10"]}
          style={styles.statsGradient}
        >
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{members.length}</Text>
              <Text style={styles.statLabel}>Total Members</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: "#10B981" }]}>
                {members.filter((m) => (m.balance || 0) === 0).length}
              </Text>
              <Text style={styles.statLabel}>Settled</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: "#EF4444" }]}>
                {members.filter((m) => (m.balance || 0) !== 0).length}
              </Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Members List */}
      <FlatList
        data={filteredMembers}
        renderItem={renderMemberCard}
        keyExtractor={(item) => item.userId}
        contentContainerStyle={styles.membersList}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Ionicons name="people" size={48} color="#9CA3AF" />
            <Text style={styles.emptyStateText}>No members found</Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery
                ? "Try a different search term"
                : "Add members to get started"}
            </Text>
          </View>
        )}
      />

      {renderAddModal()}
      {renderRemoveModal()}
      {renderAdminModal()}
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
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
  statsCard: {
    margin: 20,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statsGradient: {
    padding: 20,
    backgroundColor: "#FFFFFF",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  membersList: {
    padding: 20,
    paddingTop: 0,
  },
  separator: {
    height: 12,
  },
  memberCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  memberHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  memberAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#8B5CF6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  memberInitial: {
    fontSize: 20,
    fontWeight: "700",
    color: "white",
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    flexWrap: "wrap",
    gap: 4,
  },
  memberName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginRight: 8,
    maxWidth: 160, // or adjust as needed
  },
  ownerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EDE9FE",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 0, // remove marginLeft to allow wrapping
    marginTop: 4, // add marginTop for spacing if wrapped
  },
  adminText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#8B5CF6",
    marginLeft: 4,
  },
  memberEmail: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
  memberStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  memberBalance: {
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  memberStatus: {
    fontSize: 12,
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  memberAction: {
    padding: 8,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
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
    maxHeight: "80%",
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
  modalBody: {
    padding: 20,
  },
  searchResults: {
    marginTop: 20,
  },
  searchResultsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  searchResultsList: {
    maxHeight: 200,
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  searchResultInfo: {
    flex: 1,
    marginLeft: 12,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  searchResultEmail: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  noResults: {
    alignItems: "center",
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
  },
  confirmationContent: {
    alignItems: "center",
    paddingVertical: 20,
  },
  confirmationTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginTop: 16,
    marginBottom: 12,
  },
  confirmationText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: "row",
    marginTop: 24,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    marginRight: 8,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  modalRemoveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#EF4444",
    alignItems: "center",
    marginLeft: 8,
  },
  modalRemoveText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  memberInfoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  adminActions: {
    gap: 12,
  },
  adminActionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  adminActionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#8B5CF6",
    marginLeft: 12,
  },
  removeActionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  removeActionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#EF4444",
    marginLeft: 12,
  },
});

export default ManageMembers;
