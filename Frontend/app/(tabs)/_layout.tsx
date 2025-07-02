import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#7C3AED", // purple
        tabBarInactiveTintColor: "#9CA3AF", // gray
        tabBarStyle: {
          backgroundColor: "#000",
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          height: 60,
          borderTopColor: "transparent",
          elevation: 10,
          shadowColor: "#A78BFA",
          shadowOpacity: 0.2,
          shadowOffset: { width: 0, height: -1 },
          shadowRadius: 6,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
          paddingBottom: 2,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => (
            <Ionicons name="home-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="group"
        options={{
          title: "Group",
          tabBarIcon: ({ color }) => (
            <Ionicons name="people-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ocr"
        options={{
          title: "OCR",
          tabBarIcon: ({ color }) => (
            <Ionicons name="camera-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: "Reports",
          tabBarIcon: ({ color }) => (
            <Ionicons name="bar-chart-outline" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
