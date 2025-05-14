import { useThemeColor } from "@/hooks/useThemeColor";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabLayout() {
  const tintColor = useThemeColor(
    { light: "#121212", dark: "#ffffff" },
    "text"
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tintColor,
        tabBarStyle: {
          backgroundColor: useThemeColor(
            { light: "#121212", dark: "#121212" },
            "background"
          ),
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "Camera",
          tabBarIcon: ({ color }) => (
            <Ionicons name="camera" size={24} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Gallery",
          tabBarIcon: ({ color }) => (
            <Ionicons name="images" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
