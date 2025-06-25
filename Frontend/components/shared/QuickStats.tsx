import { View, Text, StyleSheet } from "react-native";

export default function QuickStats() {
  return (
    <View style={styles.row}>
      <View style={styles.card}>
        <Text style={styles.label}>Total Spent</Text>
        <Text style={styles.value}>₹12,300</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Budget Left</Text>
        <Text style={styles.value}>₹7,700</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginHorizontal: 6,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  value: {
    fontSize: 20,
    fontWeight: "700",
    color: "#007AFF",
  },
});
