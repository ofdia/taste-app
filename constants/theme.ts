import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#231815",
    background: "#f7f1e8",
    tint: "#b2462a",
    icon: "#8f8073",
    tabIconDefault: "#8f8073",
    tabIconSelected: "#b2462a",
    card: "#fffaf4",
    surface: "#f2e5d6",
    border: "#eddccc",
    accent: "#d86f45",
    accentSoft: "#fde5d7",
    success: "#2f6a48",
    danger: "#b33f34",
    muted: "#6f6256",
  },
  dark: {
    text: "#f5efe7",
    background: "#1b1714",
    tint: "#ffb088",
    icon: "#b8a79a",
    tabIconDefault: "#907e71",
    tabIconSelected: "#ffb088",
    card: "#2a231e",
    surface: "#372e28",
    border: "#56463b",
    accent: "#ff9b6b",
    accentSoft: "#4a3024",
    success: "#81c995",
    danger: "#ff8c80",
    muted: "#c1b2a7",
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "'Trebuchet MS', 'Segoe UI', sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'Avenir Next', 'Trebuchet MS', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Courier New', monospace",
  },
});

export const AppTheme = {
  radius: {
    sm: 12,
    md: 20,
    lg: 20,
    pill: 999,
  },
  spacing: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },
  type: {
    kicker: 11,
    screenTitle: 30,
    sectionTitle: 20,
    body: 15,
    meta: 13,
    caption: 12,
  },
  borderWidth: {
    soft: 0.75,
    normal: 1,
  },
  shadow: Platform.select({
    ios: {
      shadowColor: "#71442d",
      shadowOpacity: 0.08,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 8 },
    },
    android: {
      elevation: 2,
    },
    default: {},
  }),
};
