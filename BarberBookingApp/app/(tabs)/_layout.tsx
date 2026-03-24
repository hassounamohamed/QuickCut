import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { View } from "react-native";
import { BottomAdBanner } from '@/components/ads/BottomAdBanner';
import { useAppColors } from '@/hooks/use-app-colors';

export default function TabsLayout() {
  const { colors } = useAppColors();

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderTopColor: colors.divider,
            height: 62,
            paddingBottom: 8,
            paddingTop: 4,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "600",
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: "Search",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="search-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="appointments"
          options={{
            title: "Appointments",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="calendar-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="favorites"
          options={{
            title: "Favorites",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="heart-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            href: null,
            title: 'Notifications',
          }}
        />
      </Tabs>
      <BottomAdBanner />
    </View>
  );
}