import { Colors } from "@/constants/Colors";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  useColorScheme,
} from "react-native";

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <View style={styles.header}>
        <Image
          source={{
            uri: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSjHNf3WkJp7E5H7BR86f5RYuPQ50iBl9_b6A&s",
          }}
          style={styles.avatar}
        />
        <Text style={[styles.name, { color: themeColors.text }]}>
          Rakshita Garg
        </Text>
        <Text style={[styles.email, { color: themeColors.icon }]}>
          Rakshitagarg08@gmail.com
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
          About
        </Text>
        <Text style={[styles.sectionContent, { color: themeColors.icon }]}>
          A passionate software developer building awesome apps with React
          Native and Expo.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
          Settings
        </Text>
        <Text style={[styles.sectionContent, { color: themeColors.icon }]}>
          - Dark mode: {colorScheme}
          {"\n"}- Notifications: Enabled
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    marginTop: 32,
    marginBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
  },
  email: {
    fontSize: 14,
    color: "#777",
  },
  section: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 6,
  },
  sectionContent: {
    fontSize: 14,
    lineHeight: 20,
  },
});
