import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FeedbackBanner } from "@/components/feedback-banner";
import { ScreenHeader } from "@/components/screen-header";
import { AppTheme, Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getFavoriteRamenShops, removeFavoriteRamenShop } from "@/services/favorite-shops";
import { getVisitedOn } from "@/services/log-date";
import AsyncStorage from "@/services/storage";
import type { FoodLog } from "@/types/food-log";

type FavoriteShopSummary = {
  name: string;
  visitCount: number;
  averageRating: string;
  latestVisitedOn: string;
};

const EMPTY_LABEL = "아직 기록 없음";

const createFavoriteSummary = (shopName: string, logs: FoodLog[]): FavoriteShopSummary => {
  const shopLogs = logs.filter((log) => log.restaurant === shopName);
  const sortedLogs = [...shopLogs].sort((a, b) => getVisitedOn(b).localeCompare(getVisitedOn(a)));

  let ratingSum = 0;
  let ratingCount = 0;

  for (const log of shopLogs) {
    const rating = Number(log.rating);

    if (!Number.isNaN(rating) && rating > 0) {
      ratingSum += rating;
      ratingCount += 1;
    }
  }

  return {
    name: shopName,
    visitCount: shopLogs.length,
    averageRating: ratingCount > 0 ? `${(ratingSum / ratingCount).toFixed(1)} / 5` : "별점 없음",
    latestVisitedOn: sortedLogs[0] ? getVisitedOn(sortedLogs[0]) : EMPTY_LABEL,
  };
};

export default function FavoritesScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const insets = useSafeAreaInsets();
  const palette = Colors[colorScheme];
  const styles = getStyles(palette, insets.top);

  const [favorites, setFavorites] = useState<FavoriteShopSummary[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timer = setTimeout(() => setFeedback(null), 2500);
    return () => clearTimeout(timer);
  }, [feedback]);

  const loadFavorites = async () => {
    try {
      const [savedFavoriteShops, savedLogs] = await Promise.all([
        getFavoriteRamenShops(),
        AsyncStorage.getItem("foodLogs"),
      ]);

      const logs: FoodLog[] = savedLogs ? JSON.parse(savedLogs) : [];
      setFavorites(savedFavoriteShops.map((shop) => createFavoriteSummary(shop, logs)));
    } catch (error) {
      console.error(error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, []),
  );

  const handleRemoveFavorite = async (shopName: string) => {
    try {
      await removeFavoriteRamenShop(shopName);
      setFavorites((current) => current.filter((item) => item.name !== shopName));
      setFeedback("찜 목록에서 제거했어요.");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <ScreenHeader
        palette={palette}
        kicker="찜한 가게"
        title="찜한 가게"
        subtitle="다시 가고 싶은 라멘집만 모아 평균 별점과 최근 방문일을 빠르게 확인합니다."
      />

      {feedback ? <FeedbackBanner palette={palette} message={feedback} /> : null}

      {favorites.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>찜한 가게가 없어요</Text>
          <Text style={styles.emptyBody}>
            기록 목록이나 상세 화면에서 가게를 찜하면 여기에 재방문 리스트가 쌓입니다.
          </Text>
          <Pressable style={styles.emptyButton} onPress={() => router.push("/explore")}>
            <Text style={styles.emptyButtonText}>기록 보러가기</Text>
          </Pressable>
        </View>
      ) : (
        favorites.map((item) => (
          <View key={item.name} style={styles.card}>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/explore",
                  params: { shop: item.name },
                })
              }
            >
              <Text style={styles.shopName}>{item.name}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.metaText}>방문 {item.visitCount}회</Text>
                <Text style={styles.metaText}>평균 {item.averageRating}</Text>
              </View>
              <Text style={styles.dateText}>최근 방문 {item.latestVisitedOn}</Text>
            </Pressable>

            <View style={styles.actionRow}>
              <Pressable
                style={styles.primaryButton}
                onPress={() =>
                  router.push({
                    pathname: "/explore",
                    params: { shop: item.name },
                  })
                }
              >
                <Text style={styles.primaryButtonText}>기록 보기</Text>
              </Pressable>
              <Pressable style={styles.secondaryButton} onPress={() => handleRemoveFavorite(item.name)}>
                <Text style={styles.secondaryButtonText}>찜 해제</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}
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
    emptyCard: {
      backgroundColor: palette.card,
      borderRadius: AppTheme.radius.lg,
      padding: AppTheme.spacing.xl,
      borderWidth: AppTheme.borderWidth.soft,
      borderColor: palette.border,
      ...AppTheme.shadow,
    },
    emptyTitle: {
      color: palette.text,
      fontSize: AppTheme.type.sectionTitle,
      fontWeight: "800",
      marginBottom: 8,
    },
    emptyBody: {
      color: palette.muted,
      fontSize: AppTheme.type.body,
      lineHeight: 22,
      marginBottom: 14,
    },
    emptyButton: {
      backgroundColor: palette.tint,
      borderRadius: AppTheme.radius.pill,
      alignItems: "center",
      paddingVertical: 12,
    },
    emptyButtonText: {
      color: "#fff",
      fontSize: AppTheme.type.meta,
      fontWeight: "800",
    },
    card: {
      backgroundColor: palette.card,
      borderRadius: AppTheme.radius.lg,
      padding: AppTheme.spacing.lg,
      borderWidth: AppTheme.borderWidth.soft,
      borderColor: palette.border,
      marginBottom: 12,
      ...AppTheme.shadow,
    },
    shopName: {
      color: palette.text,
      fontSize: AppTheme.type.sectionTitle,
      fontWeight: "800",
      marginBottom: 8,
    },
    metaRow: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 8,
      flexWrap: "wrap",
    },
    metaText: {
      color: palette.tint,
      fontSize: AppTheme.type.meta,
      fontWeight: "700",
    },
    dateText: {
      color: palette.muted,
      fontSize: AppTheme.type.meta,
    },
    actionRow: {
      flexDirection: "row",
      gap: 10,
      marginTop: 14,
    },
    primaryButton: {
      flex: 1,
      backgroundColor: palette.tint,
      borderRadius: AppTheme.radius.pill,
      alignItems: "center",
      paddingVertical: 12,
    },
    primaryButtonText: {
      color: "#fff",
      fontSize: AppTheme.type.meta,
      fontWeight: "800",
    },
    secondaryButton: {
      flex: 1,
      backgroundColor: palette.surface,
      borderRadius: AppTheme.radius.pill,
      alignItems: "center",
      paddingVertical: 12,
    },
    secondaryButtonText: {
      color: palette.text,
      fontSize: AppTheme.type.meta,
      fontWeight: "800",
    },
  });
