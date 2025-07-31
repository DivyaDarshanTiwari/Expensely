import { View, Text, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import styles from "./styles/styles";

export const DashboardHeader = ({ user }: { user: any }) => {
  const router = useRouter();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Image
          source={{
            uri:
              user?.photoURL ||
              "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y",
          }}
          style={styles.profileImage}
        />
        <View style={styles.userInfo}>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.userName}>
            {user?.displayName || user?.email || "User"}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.settingsButton}
        activeOpacity={0.7}
        onPress={() => router.push("../profile")}
      >
        <Ionicons name="settings-outline" size={24} color="#6B7280" />
      </TouchableOpacity>
    </View>
  );
};
