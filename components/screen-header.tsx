import { StyleSheet, Text, View } from "react-native";

import { AppTheme, Colors, Fonts } from "@/constants/theme";

type Props = {
  palette: (typeof Colors)["light"];
  kicker: string;
  title: string;
  subtitle?: string;
};

export function ScreenHeader({ palette, kicker, title, subtitle }: Props) {
  const styles = getStyles(palette);

  return (
    <View style={styles.wrap}>
      <Text style={styles.kicker}>{kicker}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const getStyles = (palette: (typeof Colors)["light"]) =>
  StyleSheet.create({
    wrap: {
      marginBottom: AppTheme.spacing.lg,
      gap: 6,
    },
    kicker: {
      color: palette.tint,
      fontSize: AppTheme.type.kicker,
      letterSpacing: 2,
      fontWeight: "800",
    },
    title: {
      color: palette.text,
      fontSize: AppTheme.type.screenTitle,
      fontWeight: "800",
      fontFamily: Fonts?.rounded,
      lineHeight: 34,
    },
    subtitle: {
      color: palette.muted,
      fontSize: AppTheme.type.meta,
      lineHeight: 19,
      maxWidth: "90%",
    },
  });
