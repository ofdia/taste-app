import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme() ?? "light";
  const palette = Colors[colorScheme];

  const navigationTheme =
    colorScheme === "dark"
      ? {
          ...DarkTheme,
          colors: {
            ...DarkTheme.colors,
            background: palette.background,
            card: palette.card,
            border: palette.border,
            primary: palette.tint,
            text: palette.text,
          },
        }
      : {
          ...DefaultTheme,
          colors: {
            ...DefaultTheme.colors,
            background: palette.background,
            card: palette.card,
            border: palette.border,
            primary: palette.tint,
            text: palette.text,
          },
        };

  return (
    <SafeAreaProvider>
      <ThemeProvider value={navigationTheme}>
        <Stack
          screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.background } }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="detail" />
          <Stack.Screen name="edit" />
          <Stack.Screen name="modal" options={{ presentation: "modal" }} />
        </Stack>
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
