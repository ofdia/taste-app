import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppTheme, Colors } from "@/constants/theme";

type Props = {
  palette: (typeof Colors)["light"];
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function FeedbackBanner({ palette, message, actionLabel, onAction }: Props) {
  const styles = getStyles(palette);

  return (
    <View style={styles.wrap}>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction}>
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const getStyles = (palette: (typeof Colors)["light"]) =>
  StyleSheet.create({
    wrap: {
      backgroundColor: palette.text,
      borderRadius: AppTheme.radius.md,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginBottom: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    message: {
      flex: 1,
      color: palette.card,
      fontSize: AppTheme.type.meta,
      fontWeight: "700",
    },
    action: {
      color: palette.accentSoft,
      fontSize: AppTheme.type.meta,
      fontWeight: "800",
    },
  });
