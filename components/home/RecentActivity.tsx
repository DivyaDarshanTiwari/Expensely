import { View, Text, StyleSheet } from "react-native";

export default function RecentActivity() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recent Activity</Text>
      {[
        { name: "Paid Electricity Bill", amount: "-₹1,200" },
        { name: "Bought Groceries", amount: "-₹900" },
        { name: "Cab to Airport", amount: "-₹700" },
      ].map((item, index) => (
        <View style={styles.item} key={index}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.amount}>{item.amount}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 12,
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  name: {
    fontSize: 14,
    color: "#444",
  },
  amount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FF3B30",
  },
});
