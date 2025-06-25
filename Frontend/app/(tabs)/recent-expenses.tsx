// app/(tabs)/recent-expenses.tsx
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

const dummyExpenses = [
  { id: "1", category: "Food", amount: 25.99, date: "2025-06-20" },
  { id: "2", category: "Travel", amount: 120.0, date: "2025-06-19" },
  { id: "3", category: "Shopping", amount: 75.5, date: "2025-06-18" },
];

export default function RecentExpensesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recent Expenses</Text>

      <TextInput
        placeholder="Search..."
        style={styles.searchInput}
        placeholderTextColor="#888"
      />

      <FlatList
        data={dummyExpenses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={styles.row}>
              <Text style={styles.itemCategory}>{item.category}</Text>
              <Text style={styles.itemAmount}>₹ {item.amount.toFixed(2)}</Text>
            </View>
            <Text style={styles.itemDate}>{item.date}</Text>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 24 }}
      />

      <TouchableOpacity style={styles.filterButton}>
        <Text style={styles.filterText}>Apply Filters</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f9f9", padding: 16 },
  title: { fontSize: 26, fontWeight: "600", color: "#333", marginBottom: 12 },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  item: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    elevation: 3, // shadow for Android / Expo Go
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemCategory: { fontSize: 16, fontWeight: "500", color: "#333" },
  itemAmount: { fontSize: 16, fontWeight: "600", color: "#007AFF" },
  itemDate: { fontSize: 12, color: "#888", marginTop: 4 },
  filterButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 16,
  },
  filterText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
