import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import Constants from "expo-constants";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../auth/firebase";
import { getStoredUserId } from "../utils/storage";

const GroupBalances = () => {
  const router = useRouter();
  const { groupId, groupName, groupData } = useLocalSearchParams();
  const group = groupData ? JSON.parse(groupData as string) : {};

  const [backendUserId, setBackendUserId] = useState<number | null>(null);
  const [idToken, setIdToken] = useState("");
  const [balances, setBalances] = useState({ owesMe: [], iOwe: [] });
  const [balancesLoading, setBalancesLoading] = useState(true);
  const [settlingUserId, setSettlingUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserIdAndToken = async () => {
      const storedUserId = await getStoredUserId();
      console.log("Stored userId:", storedUserId);
      if (storedUserId) setBackendUserId(Number(storedUserId));
      if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        setIdToken(token);
      }
    };
    fetchUserIdAndToken();
  }, []);

  const fetchBalances = async () => {
    setBalancesLoading(true);
    try {
      // if (!backendUserId) return;
      const balancesRes = await axios.post(
        `${Constants.expoConfig?.extra?.Group_URL}/api/v1/group/balances/${groupId}`,
        {},
        { headers: { Authorization: `Bearer ${idToken}` } }
      );
      setBalances(balancesRes.data);
    } catch (error) {
      console.error("Failed to fetch balances", error);
    } finally {
      setBalancesLoading(false);
    }
  };

  useEffect(() => {
    if (backendUserId && idToken) {
      fetchBalances();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backendUserId, idToken]);

  const handleSettleUp = async (otherUserId: string, amount: number, type: 'owesMe' | 'iOwe') => {
    setSettlingUserId(otherUserId + '-' + type);
    try {
      if (!backendUserId) return;
      const fromUserId = type === 'owesMe' ? otherUserId : backendUserId;
      const toUserId = type === 'owesMe' ? backendUserId : otherUserId;
      await axios.post(
        `${Constants.expoConfig?.extra?.Group_URL}/api/v1/group/settleUpWithUser/${groupId}`,
        { fromUserId, toUserId, amount },
        { headers: { Authorization: `Bearer ${idToken}` } }
      );
      await fetchBalances();
    } catch (error) {
      console.error("Failed to settle up", error);
    } finally {
      setSettlingUserId(null);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{groupName || group.name}</Text>
          <Text style={styles.headerSubtitle}>Group Balances</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* People who owe you */}
        <View style={styles.balanceSection}>
          <Text style={styles.balanceSectionTitle}>People who owe you</Text>
          {balancesLoading ? (
            <ActivityIndicator size="small" color="#2563EB" style={{ marginVertical: 20 }} />
          ) : balances.owesMe.length > 0 ? (
            balances.owesMe.map((item: any, index: number) => (
              <View key={index} style={styles.balanceItem}>
                <View style={styles.balanceRow}>
                  <Text style={styles.balanceName}>{item.username}</Text>
                  <Text style={[styles.balanceAmount, { color: "#10B981" }]}>+₹{item.amount}</Text>
                </View>
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.settleButton}
                    disabled={settlingUserId === item.userId + '-owesMe'}
                    onPress={() => handleSettleUp(item.userId, item.amount, 'owesMe')}
                  >
                    <Text style={{ color: '#2563EB', fontWeight: '600' }}>
                      {settlingUserId === item.userId + '-owesMe' ? 'Settling...' : 'Settle Up'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.remindButton} disabled>
                    <Text style={{ color: '#9CA3AF' }}>Remind</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noBalanceText}>No one owes you money</Text>
          )}
        </View>
        {/* People you owe */}
        <View style={styles.balanceSection}>
          <Text style={styles.balanceSectionTitle}>People you owe</Text>
          {balancesLoading ? (
            <ActivityIndicator size="small" color="#2563EB" style={{ marginVertical: 20 }} />
          ) : balances.iOwe.length > 0 ? (
            balances.iOwe.map((item: any, index: number) => (
              <View key={index} style={styles.balanceItem}>
                <View style={styles.balanceRow}>
                  <Text style={styles.balanceName}>{item.username}</Text>
                  <Text style={[styles.balanceAmount, { color: "#EF4444" }]}>-₹{item.amount}</Text>
                </View>
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.settleButton}
                    disabled={settlingUserId === item.userId + '-iOwe'}
                    onPress={() => handleSettleUp(item.userId, item.amount, 'iOwe')}
                  >
                    <Text style={{ color: '#2563EB', fontWeight: '600' }}>
                      {settlingUserId === item.userId + '-iOwe' ? 'Settling...' : 'Settle Up'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.remindButton} disabled>
                    <Text style={{ color: '#9CA3AF' }}>Remind</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noBalanceText}>You don't owe anyone money</Text>
          )}
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  balanceSection: {
    marginBottom: 32,
  },
  balanceSectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  balanceItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  balanceName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: "700",
  },
  buttonRow: {
    flexDirection: "row",
    marginTop: 12,
    justifyContent: "flex-start",
  },
  settleButton: {
    marginRight: 12,
    paddingVertical: 8,
    paddingHorizontal: 18,
    backgroundColor: '#E0E7FF',
    borderRadius: 8,
  },
  remindButton: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  noBalanceText: {
    fontSize: 14,
    color: "#6B7280",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 20,
  },
});

export default GroupBalances; 