import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FeedbackBanner } from "@/components/feedback-banner";
import { ScreenHeader } from "@/components/screen-header";
import { AppTheme, Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { isFavoriteRamenShop, toggleFavoriteRamenShop } from "@/services/favorite-shops";
import { formatDisplayDate, getVisitedOn } from "@/services/log-date";
import AsyncStorage from "@/services/storage";
import type { FoodLog } from "@/types/food-log";

const renderStars = (rating?: string) => {
  const num = Number(rating);

  if (Number.isNaN(num) || num <= 0) {
    return "No rating";
  }

  return "★".repeat(num);
};

const optionRows = (log: FoodLog) =>
  [
    { label: "Broth", value: log.brothSaltiness },
    { label: "Noodle", value: log.noodleFirmness },
    { label: "Oil", value: log.oilAmount },
  ].filter((item) => item.value);

export default function DetailScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const insets = useSafeAreaInsets();
  const palette = Colors[colorScheme];
  const styles = getStyles(palette, insets.top);
  const { id } = useLocalSearchParams<{ id: string }>();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [log, setLog] = useState<FoodLog | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    const loadLog = async () => {
      try {
        const savedLogs = await AsyncStorage.getItem("foodLogs");
        const logs: FoodLog[] = savedLogs ? JSON.parse(savedLogs) : [];
        const nextLog = logs.find((item) => item.id === id) ?? null;

        setLog(nextLog);

        if (nextLog?.restaurant) {
          setIsFavorite(await isFavoriteRamenShop(nextLog.restaurant));
        } else {
          setIsFavorite(false);
        }
      } catch (error) {
        console.error(error);
      }
    };

    if (id) {
      loadLog();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [id]);

  if (!log) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyTitle}>Entry not found</Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const options = optionRows(log);

  const handleToggleFavorite = async () => {
    try {
      const nextFavorite = await toggleFavoriteRamenShop(log.restaurant);
      setIsFavorite(nextFavorite);
      setFeedback(nextFavorite ? "Added to favorites." : "Removed from favorites.");

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => setFeedback(null), 2500);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <ScreenHeader
        palette={palette}
        kicker="ENTRY DETAIL"
        title={log.menu}
        subtitle={`${log.restaurant} · ${formatDisplayDate(getVisitedOn(log))}`}
      />

      {feedback ? <FeedbackBanner palette={palette} message={feedback} /> : null}

      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{log.ramenType || "Type unset"}</Text>
          </View>
          <Pressable style={styles.favoriteButton} onPress={handleToggleFavorite}>
            <Text style={styles.favoriteButtonText}>{isFavorite ? "Unsave" : "Save"}</Text>
          </Pressable>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.rating}>{renderStars(log.rating)}</Text>
          <Text style={styles.dateText}>Visited {formatDisplayDate(getVisitedOn(log))}</Text>
        </View>
      </View>

      {log.photoUri ? <Image source={log.photoUri} style={styles.photo} contentFit="cover" /> : null}

      {options.length > 0 ? (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Options</Text>
          {options.map((item) => (
            <View key={item.label} style={styles.optionRow}>
              <Text style={styles.optionLabel}>{item.label}</Text>
              <Text style={styles.optionValue}>{item.value}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Review</Text>
        <Text style={styles.reviewText}>
          {log.review?.trim() ? log.review : "No written review yet."}
        </Text>
      </View>

      <View style={styles.actionRow}>
        <Pressable
          style={styles.editButton}
          onPress={() =>
            router.push({
              pathname: "/edit",
              params: { id: log.id },
            })
          }
        >
          <Text style={styles.primaryActionText}>Edit</Text>
        </Pressable>
        <Pressable style={styles.ghostButton} onPress={() => router.back()}>
          <Text style={styles.ghostButtonText}>Back to list</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const getStyles = (palette: (typeof Colors)["light"], topInset: number) =>
  StyleSheet.create({
    container: {
      padding: AppTheme.spacing.lg,
      paddingTop: topInset + 16,
      paddingBottom: 40,
      backgroundColor: palette.background,
    },
    emptyWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: AppTheme.spacing.xl,
      backgroundColor: palette.background,
    },
    emptyTitle: {
      color: palette.text,
      fontSize: AppTheme.type.sectionTitle,
      fontWeight: "800",
      marginBottom: 16,
    },
    backButton: {
      backgroundColor: palette.tint,
      paddingVertical: 14,
      paddingHorizontal: 18,
      borderRadius: AppTheme.radius.pill,
    },
    backButtonText: {
      color: "#fff",
      fontSize: AppTheme.type.body,
      fontWeight: "800",
    },
    heroCard: {
      backgroundColor: palette.card,
      borderRadius: AppTheme.radius.lg,
      padding: AppTheme.spacing.lg,
      borderWidth: AppTheme.borderWidth.soft,
      borderColor: palette.border,
      marginBottom: 16,
      ...AppTheme.shadow,
    },
    heroTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
      marginBottom: 14,
    },
    favoriteButton: {
      backgroundColor: palette.surface,
      borderRadius: AppTheme.radius.pill,
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    favoriteButtonText: {
      color: palette.tint,
      fontSize: AppTheme.type.meta,
      fontWeight: "800",
    },
    metaRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 10,
      flexWrap: "wrap",
    },
    badge: {
      backgroundColor: palette.surface,
      borderRadius: AppTheme.radius.pill,
      paddingVertical: 7,
      paddingHorizontal: 14,
    },
    badgeText: {
      color: palette.tint,
      fontSize: AppTheme.type.meta,
      fontWeight: "800",
    },
    rating: {
      color: palette.accent,
      fontSize: AppTheme.type.body,
      fontWeight: "800",
    },
    dateText: {
      color: palette.muted,
      fontSize: AppTheme.type.meta,
    },
    photo: {
      width: "100%",
      height: 260,
      borderRadius: AppTheme.radius.lg,
      marginBottom: 16,
      backgroundColor: palette.surface,
    },
    sectionCard: {
      backgroundColor: palette.card,
      borderRadius: AppTheme.radius.lg,
      padding: AppTheme.spacing.lg,
      borderWidth: AppTheme.borderWidth.soft,
      borderColor: palette.border,
      marginBottom: 16,
      ...AppTheme.shadow,
    },
    sectionTitle: {
      color: palette.text,
      fontSize: AppTheme.type.sectionTitle,
      fontWeight: "800",
      marginBottom: 12,
    },
    optionRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 10,
      borderTopWidth: AppTheme.borderWidth.soft,
      borderTopColor: palette.border,
    },
    optionLabel: {
      color: palette.muted,
      fontSize: AppTheme.type.meta,
      fontWeight: "700",
    },
    optionValue: {
      color: palette.text,
      fontSize: AppTheme.type.body,
      fontWeight: "800",
    },
    reviewText: {
      color: palette.text,
      fontSize: AppTheme.type.body,
      lineHeight: 24,
    },
    actionRow: {
      flexDirection: "row",
      gap: 10,
    },
    editButton: {
      flex: 1,
      backgroundColor: palette.tint,
      paddingVertical: 14,
      borderRadius: AppTheme.radius.pill,
      alignItems: "center",
    },
    primaryActionText: {
      color: "#fff",
      fontSize: AppTheme.type.body,
      fontWeight: "800",
    },
    ghostButton: {
      flex: 1,
      backgroundColor: palette.surface,
      paddingVertical: 14,
      borderRadius: AppTheme.radius.pill,
      alignItems: "center",
    },
    ghostButtonText: {
      color: palette.text,
      fontSize: AppTheme.type.body,
      fontWeight: "800",
    },
  });
