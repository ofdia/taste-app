import { Tabs } from "expo-router";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? "light";
  const palette = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: palette.tint,
        tabBarInactiveTintColor: palette.tabIconDefault,
        tabBarStyle: {
          backgroundColor: palette.card,
          borderTopColor: palette.border,
          height: 62 + insets.bottom,
          paddingTop: 10,
          paddingBottom: Math.max(10, insets.bottom),
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "700",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "홈",
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "기록",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="book.closed.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: "찜",
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="heart.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: "분석",
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="chart.bar.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          href: null,
          title: "추가",
          tabBarItemStyle: { display: "none" },
        }}
      />
    </Tabs>
  );
}
