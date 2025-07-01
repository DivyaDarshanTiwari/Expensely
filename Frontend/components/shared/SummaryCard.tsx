// import { View, Text, StyleSheet } from "react-native";

// export default function SummaryCard({
//   title,
//   amount,
//   type = "balance",
// }: {
//   title: string;
//   amount: string;
//   type: string;
// }) {
//   const accentColor =
//     type === "income" ? "#14B8A6" : type === "expense" ? "#EF4444" : "#3B82F6";

//   return (
//     <View style={[styles.card, { borderLeftColor: accentColor }]}>
//       <Text style={styles.title}>{title}</Text>
//       <Text style={[styles.amount, { color: accentColor }]}>{amount}</Text>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   card: {
//     backgroundColor: "#D8B4FE", // slightly darker than gridItem
//     borderRadius: 12,
//     padding: 14,
//     flex: 1,
//     borderLeftWidth: 4,
//     borderLeftColor: "#A78BFA", // accent border
//   },
//   title: {
//     fontSize: 13,
//     color: "#6B7280",
//     marginBottom: 4,
//   },
//   amount: {
//     fontSize: 20,
//     fontWeight: "700",
//     color: "#4C1D95",
//   },
// });

import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

export default function SummaryCard({
  title,
  amount,
  type = "balance",
}: {
  title: string;
  amount: string;
  type: string;
}) {
  const accentColor =
    type === "income" ? "#14B8A6" : type === "expense" ? "#EF4444" : "#6366F1";

  const iconName =
    type === "income"
      ? "trending-up"
      : type === "expense"
        ? "trending-down"
        : "activity";

  return (
    <View style={[styles.card, { backgroundColor: "#F3E8FF" }]}>
      <Feather name={iconName} size={24} color={accentColor} />
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.amount, { color: accentColor }]}>{amount}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 6,
    elevation: 3,
    shadowColor: "#A78BFA",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    marginHorizontal: 4,
  },
  title: {
    fontSize: 13,
    color: "#6B7280",
  },
  amount: {
    fontSize: 22,
    fontWeight: "700",
  },
});
