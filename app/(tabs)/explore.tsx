import { useFocusEffect } from "@react-navigation/native";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FeedbackBanner } from "@/components/feedback-banner";
import { ScreenHeader } from "@/components/screen-header";
import { AppTheme, Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getFavoriteRamenShops, toggleFavoriteRamenShop } from "@/services/favorite-shops";
import { getVisitedOn } from "@/services/log-date";
import AsyncStorage from "@/services/storage";
import type { FoodLog } from "@/types/food-log";

type ViewMode = "all" | "photos";
type RatingFilter = "all" | "1" | "2" | "3" | "4" | "5";
type PhotoGridItem = FoodLog | { id: string; isPlaceholder: true };

const calculateShopAverage = (logs: FoodLog[], shopName: string) => {
  const filtered = logs.filter((log) => log.restaurant === shopName);
  let sum = 0;
  let count = 0;

  filtered.forEach((log) => {
    const rating = Number(log.rating);
    if (!Number.isNaN(rating) && rating > 0) {
      sum += rating;
      count += 1;
    }
  });

  if (count === 0) {
    return "별점 없음";
  }

  return `${(sum / count).toFixed(1)} / 5`;
};

const isFavoriteShopName = (favorites: string[], shopName: string) =>
  favorites.some((shop) => shop.toLocaleLowerCase("ko-KR") === shopName.toLocaleLowerCase("ko-KR"));

const renderStars = (rating?: string) => {
  const num = Number(rating);

  if (Number.isNaN(num) || num <= 0) {
    return "별점 없음";
  }

  return `${num}점 / 5`;
};

export default function ExploreScreen() {
  const { shop } = useLocalSearchParams<{ shop?: string }>();
  const colorScheme = useColorScheme() ?? "light";
  const insets = useSafeAreaInsets();
  const palette = Colors[colorScheme];
  const styles = getStyles(palette, insets.top);
  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [favoriteShops, setFavoriteShops] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [searchQuery, setSearchQuery] = useState(typeof shop === "string" ? shop : "");
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; actionLabel?: string; onAction?: () => void } | null>(null);

  const showFeedback = useCallback(
    (message: string, actionLabel?: string, onAction?: () => void) => {
      setFeedback({ message, actionLabel, onAction });

      if (bannerTimerRef.current) {
        clearTimeout(bannerTimerRef.current);
      }

      bannerTimerRef.current = setTimeout(() => {
        setFeedback(null);
      }, 3500);
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (bannerTimerRef.current) {
        clearTimeout(bannerTimerRef.current);
      }
    };
  }, []);

  const persistLogs = async (nextLogs: FoodLog[]) => {
    await AsyncStorage.setItem("foodLogs", JSON.stringify(nextLogs));
    setLogs(nextLogs);
  };

  const loadLogs = async () => {
    try {
      const [savedLogs, savedFavoriteShops] = await Promise.all([
        AsyncStorage.getItem("foodLogs"),
        getFavoriteRamenShops(),
      ]);
      const parsedLogs: FoodLog[] = savedLogs ? JSON.parse(savedLogs) : [];
      setLogs(parsedLogs);
      setFavoriteShops(savedFavoriteShops);
    } catch (error) {
      console.error(error);
    }
  };

  const deleteLog = async (id: string) => {
    try {
      const deleted = logs.find((log) => log.id === id) ?? null;
      const updatedLogs = logs.filter((log) => log.id !== id);
      await persistLogs(updatedLogs);
      showFeedback("기록을 삭제했어요.", "되돌리기", () => {
        if (!deleted) {
          return;
        }

        const restoredLogs = [deleted, ...updatedLogs];
        persistLogs(restoredLogs).catch(console.error);
        setFeedback(null);
      });
    } catch (error) {
      console.error(error);
      Alert.alert("오류", "기록을 삭제하는 중 문제가 발생했어요.");
    }
  };

  const confirmDelete = (id: string) => {
    Alert.alert("기록 삭제", "이 기록을 삭제할까요?", [
      { text: "취소", style: "cancel" },
      { text: "삭제", style: "destructive", onPress: () => deleteLog(id) },
    ]);
  };

  useFocusEffect(
    useCallback(() => {
      loadLogs();
    }, []),
  );

  useEffect(() => {
    if (typeof shop === "string") {
      setSearchQuery(shop);
    }
  }, [shop]);

  const handleToggleFavorite = async (shopName: string) => {
    try {
      const nextFavorite = await toggleFavoriteRamenShop(shopName);

      setFavoriteShops((current) => {
        if (nextFavorite) {
          return isFavoriteShopName(current, shopName) ? current : [shopName, ...current];
        }

        return current.filter(
          (item) => item.toLocaleLowerCase("ko-KR") !== shopName.toLocaleLowerCase("ko-KR"),
        );
      });

      showFeedback(nextFavorite ? "찜 목록에 추가했어요." : "찜 목록에서 제거했어요.");
    } catch (error) {
      console.error(error);
    }
  };

  const filteredLogs = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();

    return logs.filter((log) => {
      const matchesRating = ratingFilter === "all" || log.rating === ratingFilter;

      if (!matchesRating) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      return (
        log.restaurant.toLowerCase().includes(keyword) ||
        (log.ramenType || "").toLowerCase().includes(keyword) ||
        log.menu.toLowerCase().includes(keyword)
      );
    });
  }, [logs, ratingFilter, searchQuery]);

  const filteredPhotoLogs = useMemo(
    () => filteredLogs.filter((log) => !!log.photoUri),
    [filteredLogs],
  );

  const photoGridData = useMemo<PhotoGridItem[]>(() => {
    if (filteredPhotoLogs.length === 0) {
      return [];
    }

    if (filteredPhotoLogs.length % 2 === 0) {
      return filteredPhotoLogs;
    }

    return [...filteredPhotoLogs, { id: "photo-placeholder", isPlaceholder: true }];
  }, [filteredPhotoLogs]);

  const emptyActions =
    logs.length === 0 ? (
      <Pressable style={styles.emptyPrimaryButton} onPress={() => router.push("/add")}>
        <Text style={styles.emptyPrimaryButtonText}>첫 기록 작성하기</Text>
      </Pressable>
    ) : (
      <Pressable
        style={styles.emptySecondaryButton}
        onPress={() => {
          setSearchQuery("");
          setRatingFilter("all");
          setViewMode("all");
          setIsFilterOpen(false);
        }}
      >
        <Text style={styles.emptySecondaryButtonText}>필터 초기화</Text>
      </Pressable>
    );

  const listHeader = (
    <>
      <ScreenHeader
        palette={palette}
        kicker="기록 보관함"
        title="기록"
        subtitle="기록을 살펴보고 찜한 가게를 관리해 보세요."
      />

      {feedback ? (
        <FeedbackBanner
          palette={palette}
          message={feedback.message}
          actionLabel={feedback.actionLabel}
          onAction={feedback.onAction}
        />
      ) : null}

      <View style={styles.searchShell}>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.filterInput}
            placeholder="가게, 메뉴, 라멘 종류 검색"
            placeholderTextColor={palette.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          <Pressable style={styles.filterToggleButton} onPress={() => setIsFilterOpen((value) => !value)}>
            <Text style={styles.filterToggleText}>
              {ratingFilter === "all" ? "필터" : `${ratingFilter}점`}
            </Text>
          </Pressable>
        </View>

        {(isFilterOpen || ratingFilter !== "all") && (
          <View style={styles.filterPanel}>
            <Text style={styles.filterLabel}>별점</Text>
            <View style={styles.ratingFilterRow}>
              {(["all", "5", "4", "3", "2", "1"] as RatingFilter[]).map((value) => (
                <Pressable
                  key={value}
                  style={[
                    styles.ratingFilterChip,
                    ratingFilter === value && styles.ratingFilterChipActive,
                  ]}
                  onPress={() => setRatingFilter(value)}
                >
                  <Text
                    style={[
                      styles.ratingFilterText,
                      ratingFilter === value && styles.ratingFilterTextActive,
                    ]}
                  >
                    {value === "all" ? "전체" : `${value}점`}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {(searchQuery.trim() || ratingFilter !== "all") && (
          <Pressable
            style={styles.resetFilterButton}
            onPress={() => {
              setSearchQuery("");
              setRatingFilter("all");
              setIsFilterOpen(false);
            }}
          >
            <Text style={styles.resetFilterText}>검색 초기화</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.segmentWrap}>
        <Pressable
          style={[styles.segmentButton, viewMode === "all" && styles.segmentButtonActive]}
          onPress={() => setViewMode("all")}
        >
          <Text style={[styles.segmentText, viewMode === "all" && styles.segmentTextActive]}>전체 기록</Text>
        </Pressable>
        <Pressable
          style={[styles.segmentButton, viewMode === "photos" && styles.segmentButtonActive]}
          onPress={() => setViewMode("photos")}
        >
          <Text style={[styles.segmentText, viewMode === "photos" && styles.segmentTextActive]}>사진</Text>
        </Pressable>
      </View>
    </>
  );

  if (viewMode === "all") {
    return (
      <FlatList
        style={styles.screen}
        data={filteredLogs}
        key="all-list"
        keyExtractor={(item) => item.id}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>
              {logs.length === 0 ? "아직 기록이 없어요" : "조건에 맞는 기록이 없어요"}
            </Text>
            <Text style={styles.emptyText}>
              {logs.length === 0
                ? "첫 라멘 기록을 남기고 나만의 기록장을 시작해 보세요."
                : "다른 검색어를 입력하거나 별점 필터를 초기화해 보세요."}
            </Text>
            {emptyActions}
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => {
          const favorite = isFavoriteShopName(favoriteShops, item.restaurant);

          return (
            <View style={styles.card}>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/detail",
                    params: { id: item.id },
                  })
                }
              >
                <View style={styles.topRow}>
                  <Text style={styles.restaurant}>{item.restaurant}</Text>
                  <Pressable
                    style={[styles.favoriteChip, favorite && styles.favoriteChipActive]}
                    onPress={() => handleToggleFavorite(item.restaurant)}
                  >
                    <Text style={[styles.favoriteChipText, favorite && styles.favoriteChipTextActive]}>
                      {favorite ? "찜 완료" : "찜하기"}
                    </Text>
                  </Pressable>
                </View>

                <Text style={styles.menu}>{item.menu}</Text>
                <View style={styles.metaStrip}>
                  <Text style={styles.primaryMeta}>{renderStars(item.rating)}</Text>
                  <Text style={styles.secondaryMeta}>{getVisitedOn(item)}</Text>
                  <Text style={styles.secondaryMeta}>{calculateShopAverage(logs, item.restaurant)}</Text>
                </View>

                {item.photoUri ? (
                  <Image source={item.photoUri} style={styles.photo} contentFit="cover" />
                ) : null}

                <View style={styles.badgeRow}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.ramenType || "종류 미지정"}</Text>
                  </View>
                </View>

                <Text numberOfLines={2} style={styles.reviewText}>
                  {item.review?.trim() ? item.review : "작성한 리뷰가 아직 없어요."}
                </Text>
              </Pressable>

              <View style={styles.actionRow}>
                <Pressable
                  style={styles.editButton}
                  onPress={() =>
                    router.push({
                      pathname: "/edit",
                      params: { id: item.id },
                    })
                  }
                >
                  <Text style={styles.primaryActionText}>수정</Text>
                </Pressable>

                <Pressable style={styles.ghostButton} onPress={() => confirmDelete(item.id)}>
                  <Text style={styles.ghostButtonText}>삭제</Text>
                </Pressable>
              </View>
            </View>
          );
        }}
      />
    );
  }

  return (
    <FlatList
      style={styles.screen}
      data={photoGridData}
      key="photo-grid"
      keyExtractor={(item) => item.id}
      ListHeaderComponent={listHeader}
      ListEmptyComponent={
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>
            {logs.length === 0 ? "아직 사진 기록이 없어요" : "조건에 맞는 사진이 없어요"}
          </Text>
          <Text style={styles.emptyText}>
            {logs.length === 0
              ? "기록에 사진을 추가하면 여기에서 갤러리처럼 볼 수 있어요."
              : "전체 기록으로 돌아가거나 현재 필터를 초기화해 보세요."}
          </Text>
          <Pressable
            style={styles.emptySecondaryButton}
            onPress={() => {
              setViewMode("all");
              setSearchQuery("");
              setRatingFilter("all");
              setIsFilterOpen(false);
            }}
          >
            <Text style={styles.emptySecondaryButtonText}>전체 기록 보기</Text>
          </Pressable>
        </View>
      }
      numColumns={2}
      columnWrapperStyle={styles.galleryRow}
      contentContainerStyle={styles.galleryContent}
      showsVerticalScrollIndicator={false}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      renderItem={({ item }) =>
        "isPlaceholder" in item ? (
          <View style={[styles.galleryCard, styles.galleryPlaceholder]}>
            <View style={[styles.galleryImage, styles.galleryPlaceholderBlock]} />
            <View style={styles.galleryMeta}>
              <Text style={[styles.galleryRestaurant, styles.galleryPlaceholderText]}>.</Text>
              <Text style={[styles.galleryMenu, styles.galleryPlaceholderText]}>.</Text>
            </View>
          </View>
        ) : (
          <Pressable
            style={styles.galleryCard}
            onPress={() =>
              router.push({
                pathname: "/detail",
                params: { id: item.id },
              })
            }
          >
            <Image source={item.photoUri} style={styles.galleryImage} contentFit="cover" />
            <View style={styles.galleryMeta}>
              <Text numberOfLines={1} style={styles.galleryRestaurant}>
                {item.restaurant}
              </Text>
              <Text numberOfLines={1} style={styles.galleryMenu}>
                {item.menu}
              </Text>
            </View>
          </Pressable>
        )
      }
    />
  );
}

const getStyles = (palette: (typeof Colors)["light"], topInset: number) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: palette.background,
    },
    searchShell: {
      marginBottom: 12,
    },
    searchRow: {
      flexDirection: "row",
      gap: 8,
      alignItems: "center",
      marginBottom: 8,
    },
    filterInput: {
      flex: 1,
      borderWidth: AppTheme.borderWidth.soft,
      borderColor: palette.border,
      borderRadius: AppTheme.radius.sm,
      backgroundColor: palette.card,
      color: palette.text,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: AppTheme.type.body,
    },
    filterToggleButton: {
      minWidth: 72,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: palette.surface,
      borderRadius: AppTheme.radius.sm,
      paddingVertical: 12,
      paddingHorizontal: 12,
    },
    filterToggleText: {
      color: palette.text,
      fontSize: AppTheme.type.meta,
      fontWeight: "800",
    },
    filterPanel: {
      backgroundColor: palette.card,
      borderWidth: AppTheme.borderWidth.soft,
      borderColor: palette.border,
      borderRadius: AppTheme.radius.md,
      padding: AppTheme.spacing.md,
      marginBottom: 8,
      ...AppTheme.shadow,
    },
    filterLabel: {
      color: palette.muted,
      fontSize: AppTheme.type.caption,
      fontWeight: "700",
      marginBottom: 10,
    },
    ratingFilterRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    ratingFilterChip: {
      borderWidth: AppTheme.borderWidth.soft,
      borderColor: palette.border,
      borderRadius: AppTheme.radius.pill,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: palette.background,
    },
    ratingFilterChipActive: {
      borderColor: palette.tint,
      backgroundColor: palette.tint,
    },
    ratingFilterText: {
      color: palette.text,
      fontSize: AppTheme.type.meta,
      fontWeight: "700",
    },
    ratingFilterTextActive: {
      color: "#fff",
    },
    resetFilterButton: {
      alignSelf: "flex-start",
      paddingVertical: 6,
      paddingHorizontal: 2,
    },
    resetFilterText: {
      color: palette.tint,
      fontSize: AppTheme.type.caption,
      fontWeight: "800",
    },
    segmentWrap: {
      flexDirection: "row",
      backgroundColor: palette.surface,
      borderRadius: AppTheme.radius.pill,
      padding: 4,
      marginBottom: 12,
    },
    segmentButton: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 11,
      borderRadius: AppTheme.radius.pill,
    },
    segmentButtonActive: {
      backgroundColor: palette.card,
      ...AppTheme.shadow,
    },
    segmentText: {
      color: palette.muted,
      fontSize: AppTheme.type.meta,
      fontWeight: "700",
    },
    segmentTextActive: {
      color: palette.tint,
    },
    listContent: {
      paddingHorizontal: AppTheme.spacing.lg,
      paddingTop: topInset + 16,
      paddingBottom: 34,
      flexGrow: 1,
    },
    galleryContent: {
      paddingHorizontal: AppTheme.spacing.lg,
      paddingTop: topInset + 16,
      paddingBottom: 34,
      flexGrow: 1,
    },
    galleryRow: {
      gap: 12,
      marginBottom: 8,
    },
    emptyCard: {
      backgroundColor: palette.card,
      borderRadius: AppTheme.radius.md,
      padding: AppTheme.spacing.xl,
      borderWidth: AppTheme.borderWidth.soft,
      borderColor: palette.border,
      ...AppTheme.shadow,
    },
    emptyTitle: {
      color: palette.text,
      fontSize: AppTheme.type.sectionTitle,
      fontWeight: "700",
      marginBottom: 6,
    },
    emptyText: {
      color: palette.muted,
      fontSize: AppTheme.type.body,
      lineHeight: 22,
      marginBottom: 14,
    },
    emptyPrimaryButton: {
      backgroundColor: palette.tint,
      borderRadius: AppTheme.radius.pill,
      alignItems: "center",
      paddingVertical: 12,
    },
    emptyPrimaryButtonText: {
      color: "#fff",
      fontSize: AppTheme.type.meta,
      fontWeight: "800",
    },
    emptySecondaryButton: {
      backgroundColor: palette.surface,
      borderRadius: AppTheme.radius.pill,
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 14,
    },
    emptySecondaryButtonText: {
      color: palette.text,
      fontSize: AppTheme.type.meta,
      fontWeight: "800",
    },
    card: {
      backgroundColor: palette.card,
      borderRadius: AppTheme.radius.md,
      padding: AppTheme.spacing.md,
      marginBottom: 8,
      borderWidth: AppTheme.borderWidth.soft,
      borderColor: palette.border,
      ...AppTheme.shadow,
    },
    topRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 8,
      gap: 8,
    },
    restaurant: {
      color: palette.text,
      fontSize: AppTheme.type.sectionTitle,
      fontWeight: "800",
      maxWidth: "72%",
    },
    favoriteChip: {
      backgroundColor: palette.surface,
      borderRadius: AppTheme.radius.pill,
      paddingVertical: 6,
      paddingHorizontal: 10,
    },
    favoriteChipActive: {
      backgroundColor: palette.tint,
    },
    favoriteChipText: {
      color: palette.tint,
      fontSize: AppTheme.type.caption,
      fontWeight: "800",
    },
    favoriteChipTextActive: {
      color: "#fff",
    },
    menu: {
      color: palette.text,
      fontSize: AppTheme.type.body,
      fontWeight: "700",
      marginBottom: 8,
    },
    metaStrip: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginBottom: 10,
    },
    primaryMeta: {
      color: palette.accent,
      fontSize: AppTheme.type.meta,
      fontWeight: "800",
    },
    secondaryMeta: {
      color: palette.muted,
      fontSize: AppTheme.type.meta,
      fontWeight: "700",
    },
    photo: {
      width: "100%",
      height: 180,
      borderRadius: AppTheme.radius.md,
      marginBottom: 8,
      backgroundColor: palette.surface,
    },
    badgeRow: {
      flexDirection: "row",
      marginBottom: 8,
    },
    badge: {
      backgroundColor: palette.surface,
      borderRadius: AppTheme.radius.pill,
      paddingVertical: 6,
      paddingHorizontal: 12,
      alignSelf: "flex-start",
    },
    badgeText: {
      color: palette.tint,
      fontSize: AppTheme.type.meta,
      fontWeight: "700",
    },
    reviewText: {
      color: palette.muted,
      fontSize: AppTheme.type.meta,
      lineHeight: 21,
    },
    actionRow: {
      flexDirection: "row",
      gap: 10,
      marginTop: 12,
    },
    editButton: {
      flex: 1,
      backgroundColor: palette.tint,
      paddingVertical: 12,
      borderRadius: AppTheme.radius.sm,
      alignItems: "center",
    },
    primaryActionText: {
      color: "#fff",
      fontWeight: "800",
      fontSize: AppTheme.type.meta,
    },
    ghostButton: {
      flex: 1,
      backgroundColor: palette.surface,
      paddingVertical: 12,
      borderRadius: AppTheme.radius.sm,
      alignItems: "center",
    },
    ghostButtonText: {
      color: palette.danger,
      fontWeight: "800",
      fontSize: AppTheme.type.meta,
    },
    galleryCard: {
      flex: 1,
      backgroundColor: palette.card,
      borderRadius: AppTheme.radius.md,
      overflow: "hidden",
      borderWidth: AppTheme.borderWidth.soft,
      borderColor: palette.border,
      ...AppTheme.shadow,
    },
    galleryImage: {
      width: "100%",
      aspectRatio: 1,
      backgroundColor: palette.surface,
    },
    galleryMeta: {
      padding: 12,
      gap: 4,
    },
    galleryRestaurant: {
      color: palette.text,
      fontSize: AppTheme.type.meta,
      fontWeight: "800",
    },
    galleryMenu: {
      color: palette.muted,
      fontSize: AppTheme.type.caption,
      fontWeight: "600",
    },
    galleryPlaceholder: {
      backgroundColor: "transparent",
      borderColor: "transparent",
      shadowOpacity: 0,
      elevation: 0,
    },
    galleryPlaceholderBlock: {
      backgroundColor: "transparent",
    },
    galleryPlaceholderText: {
      color: "transparent",
    },
  });
