"use client"

import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native"
import { Ionicons } from "@expo/vector-icons"

interface Income {
  id: number
  amount: number
  description: string
  source: string
  date: string
  receivedBy: string
  createdAt: string
}

interface IncomeListProps {
  data: Income[]
  loading: boolean
}

const IncomeList = ({ data, loading }: IncomeListProps) => {
  const getSourceIcon = (source: string) => {
    const icons = {
      salary: "card",
      freelance: "laptop",
      business: "briefcase",
      investment: "trending-up",
      gift: "gift",
      other: "cash",
    }
    return icons[source] || "cash"
  }

  const getSourceColor = (source: string) => {
    const colors = {
      salary: "#10B981",
      freelance: "#3B82F6",
      business: "#8B5CF6",
      investment: "#F59E0B",
      gift: "#EC4899",
      other: "#6B7280",
    }
    return colors[source] || "#6B7280"
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const renderIncomeItem = ({ item }: { item: Income }) => (
    <View style={styles.incomeItem}>
      <View style={styles.incomeLeft}>
        <View style={[styles.sourceIcon, { backgroundColor: `${getSourceColor(item.source)}20` }]}>
          <Ionicons name={getSourceIcon(item.source) as any} size={20} color={getSourceColor(item.source)} />
        </View>
        <View style={styles.incomeDetails}>
          <Text style={styles.incomeDescription}>{item.description}</Text>
          <Text style={styles.incomeInfo}>
            Received by {item.receivedBy} • {formatDate(item.date)}
          </Text>
        </View>
      </View>
      <View style={styles.incomeRight}>
        <Text style={styles.incomeAmount}>+${item.amount.toFixed(2)}</Text>
        <Text style={styles.incomeSource}>{item.source.charAt(0).toUpperCase() + item.source.slice(1)}</Text>
      </View>
    </View>
  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Loading income...</Text>
      </View>
    )
  }

  if (data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="trending-up-outline" size={64} color="#D1D5DB" />
        <Text style={styles.emptyTitle}>No Income Found</Text>
        <Text style={styles.emptySubtitle}>Start by adding your first income entry to track your earnings.</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderIncomeItem}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
  incomeItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  incomeLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  sourceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  incomeDetails: {
    flex: 1,
  },
  incomeDescription: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  incomeInfo: {
    fontSize: 14,
    color: "#6B7280",
  },
  incomeRight: {
    alignItems: "flex-end",
  },
  incomeAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#10B981",
    marginBottom: 4,
  },
  incomeSource: {
    fontSize: 12,
    color: "#6B7280",
    textTransform: "capitalize",
  },
})

export default IncomeList
