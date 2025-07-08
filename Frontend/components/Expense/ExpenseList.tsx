"use client"

import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native"
import { Ionicons } from "@expo/vector-icons"

interface Expense {
  id: number
  amount: number
  description: string
  category: string
  date: string
  paidBy: string
  createdAt: string
}

interface ExpenseListProps {
  data: Expense[]
  loading: boolean
}

const ExpenseList = ({ data, loading }: ExpenseListProps) => {
  const getCategoryIcon = (category: string) => {
    const icons = {
      food: "restaurant",
      transport: "car",
      entertainment: "game-controller",
      shopping: "bag",
      utilities: "flash",
      health: "medical",
      general: "card",
    }
    return icons[category] || "card"
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      food: "#F59E0B",
      transport: "#3B82F6",
      entertainment: "#8B5CF6",
      shopping: "#EC4899",
      utilities: "#10B981",
      health: "#EF4444",
      general: "#6B7280",
    }
    return colors[category] || "#6B7280"
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const renderExpenseItem = ({ item }: { item: Expense }) => (
    <View style={styles.expenseItem}>
      <View style={styles.expenseLeft}>
        <View style={[styles.categoryIcon, { backgroundColor: `${getCategoryColor(item.category)}20` }]}>
          <Ionicons name={getCategoryIcon(item.category) as any} size={20} color={getCategoryColor(item.category)} />
        </View>
        <View style={styles.expenseDetails}>
          <Text style={styles.expenseDescription}>{item.description}</Text>
          <Text style={styles.expenseInfo}>
            Paid by {item.paidBy} • {formatDate(item.date)}
          </Text>
        </View>
      </View>
      <View style={styles.expenseRight}>
        <Text style={styles.expenseAmount}>-${item.amount.toFixed(2)}</Text>
        <Text style={styles.expenseCategory}>{item.category.charAt(0).toUpperCase() + item.category.slice(1)}</Text>
      </View>
    </View>
  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Loading expenses...</Text>
      </View>
    )
  }

  if (data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
        <Text style={styles.emptyTitle}>No Expenses Found</Text>
        <Text style={styles.emptySubtitle}>Start by adding your first expense to track your spending.</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderExpenseItem}
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
  expenseItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  expenseLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  expenseDetails: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  expenseInfo: {
    fontSize: 14,
    color: "#6B7280",
  },
  expenseRight: {
    alignItems: "flex-end",
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#EF4444",
    marginBottom: 4,
  },
  expenseCategory: {
    fontSize: 12,
    color: "#6B7280",
    textTransform: "capitalize",
  },
})

export default ExpenseList
