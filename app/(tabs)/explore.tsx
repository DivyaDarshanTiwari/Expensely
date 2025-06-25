import { View, Text, StyleSheet } from "react-native";

export default function ExploreScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Group Expenses</Text>
      <Text style={styles.subtitle}>Manage shared costs easily</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: "#f9f9f9" },
  title: { fontSize: 26, fontWeight: "600", color: "#333", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#666" },
});
