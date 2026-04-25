import { useFocusEffect } from "@react-navigation/native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  Image as RNImage,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AdBanner } from "@/components/ad-banner";
import { AppTheme, Colors, Fonts } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  formatDateInput,
  getMonthDays,
  getVisitedOn,
} from "@/services/log-date";
import AsyncStorage from "@/services/storage";
import type { FoodLog } from "@/types/food-log";

const WEEK_DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const STAMP_IMAGE = require("../../assets/images/ramen-stamp.png");

const renderStars = (rating?: string) => {
  const num = Number(rating);
  if (Number.isNaN(num) || num <= 0) return "별점 없음";
  return "★".repeat(num);
};

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const insets = useSafeAreaInsets();
  const palette = Colors[colorScheme];
  const styles = getStyles(palette, insets.top);

  const today = new Date();
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [calendarDate, setCalendarDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState(formatDateInput(today));

  const loadHomeData = async () => {
    try {
      const savedLogs = await AsyncStorage.getItem("foodLogs");
      const parsedLogs: FoodLog[] = savedLogs ? JSON.parse(savedLogs) : [];
      setLogs(parsedLogs);
    } catch (error) {
      console.error(error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadHomeData();
    }, []),
  );

  const monthLabel = new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    year: "numeric",
  }).format(calendarDate);

  const monthDays = useMemo(
    () => getMonthDays(calendarDate.getFullYear(), calendarDate.getMonth()),
    [calendarDate],
  );

  const stampedDays = useMemo(() => {
    const targetYear = calendarDate.getFullYear();
    const targetMonth = calendarDate.getMonth();
    const map = new Map<number, number>();

    logs.forEach((log) => {
      const visitedOn = getVisitedOn(log);
      const [year, month, day] = visitedOn.split("-").map(Number);

      if (year === targetYear && month === targetMonth + 1) {
        map.set(day, (map.get(day) ?? 0) + 1);
      }
    });

    return map;
  }, [calendarDate, logs]);

  const selectedLogs = useMemo(
    () => logs.filter((log) => getVisitedOn(log) === selectedDate),
    [logs, selectedDate],
  );

  const selectedDateTitle = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(selectedDate));

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>라멘로그</Text>
      </View>

      <View style={styles.calendarStage}>
        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <Pressable
              style={styles.calendarNav}
              onPress={() =>
                setCalendarDate(
                  new Date(
                    calendarDate.getFullYear(),
                    calendarDate.getMonth() - 1,
                    1,
                  ),
                )
              }
            >
              <Text style={styles.calendarNavText}>{"<"}</Text>
            </Pressable>
            <Text style={styles.calendarTitle}>{monthLabel}</Text>
            <Pressable
              style={styles.calendarNav}
              onPress={() =>
                setCalendarDate(
                  new Date(
                    calendarDate.getFullYear(),
                    calendarDate.getMonth() + 1,
                    1,
                  ),
                )
              }
            >
              <Text style={styles.calendarNavText}>{">"}</Text>
            </Pressable>
          </View>

          <View style={styles.weekRow}>
            {WEEK_DAYS.map((day) => (
              <View key={day} style={styles.weekCell}>
                <Text style={styles.weekLabel}>{day}</Text>
              </View>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {monthDays.map((cell) => {
              if (!cell.day) {
                return <View key={cell.key} style={styles.emptyCell} />;
              }

              const dateKey = formatDateInput(
                new Date(
                  calendarDate.getFullYear(),
                  calendarDate.getMonth(),
                  cell.day,
                ),
              );
              const stampCount = stampedDays.get(cell.day) ?? 0;
              const isSelected = dateKey === selectedDate;

              return (
                <Pressable
                  key={cell.key}
                  style={[styles.dayCell, isSelected && styles.dayCellSelected]}
                  onPress={() => setSelectedDate(dateKey)}
                >
                  {stampCount > 0 ? (
                    <View style={styles.stampLayer}>
                      <RNImage
                        source={STAMP_IMAGE}
                        style={styles.stampImage}
                        resizeMode="contain"
                      />
                    </View>
                  ) : null}
                  <Text
                    style={[
                      styles.dayNumber,
                      isSelected && styles.dayNumberSelected,
                    ]}
                  >
                    {cell.day}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      <Pressable
        style={styles.primaryButton}
        onPress={() => router.push("/add")}
      >
        <Text style={styles.primaryButtonText}>새 기록 추가</Text>
      </Pressable>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>선택한 날짜 리뷰</Text>
      </View>

      <View style={styles.selectedDayCard}>
        <Text style={styles.selectedDayTitle}>{selectedDateTitle}</Text>
        {selectedLogs.length === 0 ? (
          <Text style={styles.selectedDayEmpty}>
            이 날짜에는 아직 리뷰가 없어요.
          </Text>
        ) : (
          selectedLogs.map((item) => (
            <Pressable
              key={item.id}
              style={styles.selectedLogCard}
              onPress={() =>
                router.push({
                  pathname: "/detail",
                  params: { id: item.id },
                })
              }
            >
              <View style={styles.selectedLogTop}>
                <Text style={styles.selectedLogRestaurant}>
                  {item.restaurant}
                </Text>
                <Text style={styles.selectedLogRating}>
                  {renderStars(item.rating)}
                </Text>
              </View>
              <Text style={styles.selectedLogMenu}>{item.menu}</Text>
              <Text numberOfLines={2} style={styles.selectedLogReview}>
                {item.review?.trim() ? item.review : "작성한 리뷰가 없어요."}
              </Text>
            </Pressable>
          ))
        )}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>최근 기록</Text>
        <Pressable onPress={() => router.push("/explore")}>
          <Text style={styles.linkText}>전체 보기</Text>
        </Pressable>
      </View>

      {logs.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>첫 라멘 기록을 남겨보세요</Text>
          <Text style={styles.emptyBody}>
            가게와 메뉴, 날짜를 입력하면 나만의 라멘 기록장을 시작할 수 있어요.
          </Text>
        </View>
      ) : (
        logs.slice(0, 3).map((item, index) => (
          <Pressable
            key={item.id}
            style={[styles.logCard, index === 0 && styles.logCardFeatured]}
            onPress={() =>
              router.push({
                pathname: "/detail",
                params: { id: item.id },
              })
            }
          >
            <View style={styles.logTopRow}>
              <Text style={styles.restaurant}>{item.restaurant}</Text>
              <Text style={styles.rating}>{renderStars(item.rating)}</Text>
            </View>

            <Text style={styles.menu}>{item.menu}</Text>
            <Text style={styles.visitDate}>방문 날짜 {getVisitedOn(item)}</Text>

            {item.photoUri ? (
              <Image
                source={item.photoUri}
                style={styles.logPhoto}
                contentFit="cover"
              />
            ) : null}

            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {item.ramenType || "종류 미지정"}
                </Text>
              </View>
            </View>

            <Text numberOfLines={2} style={styles.reviewText}>
              {item.review?.trim() ? item.review : "작성한 리뷰가 없어요."}
            </Text>
          </Pressable>
        ))
      )}

      <AdBanner palette={palette} />
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
    primaryButton: {
      backgroundColor: palette.tint,
      borderRadius: AppTheme.radius.pill,
      paddingVertical: 15,
      alignItems: "center",
      marginTop: 5,
    },
    primaryButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "800",
    },
    screenHeader: {
      alignItems: "center",
      marginBottom: 4,
    },
    screenTitle: {
      color: palette.text,
      fontSize: 34,
      lineHeight: 40,
      fontWeight: "900",
      fontFamily: Fonts?.rounded,
      letterSpacing: 1,
    },
    sectionHeader: {
      marginTop: 18,
      marginBottom: 10,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    sectionTitle: {
      color: palette.text,
      fontSize: 21,
      fontWeight: "800",
      fontFamily: Fonts?.rounded,
    },
    linkText: {
      color: palette.tint,
      fontSize: 14,
      fontWeight: "700",
    },
    calendarStage: {
      position: "relative",
      paddingTop: 10,
      paddingBottom: 0,
      alignItems: "center",
    },
    calendarCard: {
      width: "100%",
      backgroundColor: palette.card,
      borderRadius: 28,
      paddingHorizontal: 22,
      paddingTop: 18,
      paddingBottom: 30,
      borderWidth: 1,
      borderColor: palette.border,
      ...AppTheme.shadow,
    },
    calendarHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    calendarTitle: {
      color: palette.text,
      fontSize: 24,
      fontWeight: "800",
      fontFamily: Fonts?.rounded,
    },
    calendarNav: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: palette.surface,
    },
    calendarNavText: {
      color: palette.muted,
      fontSize: 24,
      fontWeight: "700",
      lineHeight: 24,
    },
    weekRow: {
      flexDirection: "row",
      marginBottom: 12,
    },
    weekCell: {
      width: "14.2857%",
      alignItems: "center",
    },
    weekLabel: {
      textAlign: "center",
      color: palette.muted,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 1,
    },
    daysGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    emptyCell: {
      width: "14.2857%",
      height: 42,
      padding: 4,
    },
    dayCell: {
      width: "14.2857%",
      height: 42,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 999,
      position: "relative",
      overflow: "hidden",
      padding: 4,
    },
    dayCellSelected: {
      backgroundColor: palette.accentSoft,
    },
    dayNumber: {
      color: palette.text,
      fontSize: 17,
      fontWeight: "700",
      zIndex: 2,
    },
    dayNumberSelected: {
      color: palette.tint,
    },
    stampLayer: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1,
    },
    stampImage: {
      width: 38,
      height: 38,
      opacity: 0.92,
    },
    selectedDayCard: {
      backgroundColor: palette.card,
      borderRadius: AppTheme.radius.lg,
      padding: AppTheme.spacing.lg,
      borderWidth: 1,
      borderColor: palette.border,
      ...AppTheme.shadow,
    },
    selectedDayTitle: {
      color: palette.text,
      fontSize: 18,
      fontWeight: "800",
      marginBottom: 8,
    },
    selectedDayEmpty: {
      color: palette.muted,
      fontSize: 14,
      lineHeight: 21,
    },
    selectedLogCard: {
      backgroundColor: palette.background,
      borderRadius: AppTheme.radius.md,
      padding: AppTheme.spacing.md,
      borderWidth: 1,
      borderColor: palette.border,
      marginBottom: 8,
    },
    selectedLogTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 6,
      gap: 8,
    },
    selectedLogRestaurant: {
      color: palette.text,
      fontSize: 16,
      fontWeight: "800",
      maxWidth: "70%",
    },
    selectedLogRating: {
      color: palette.accent,
      fontSize: 12,
      fontWeight: "700",
    },
    selectedLogMenu: {
      color: palette.text,
      fontSize: 15,
      marginBottom: 6,
    },
    selectedLogReview: {
      color: palette.muted,
      fontSize: 13,
      lineHeight: 20,
    },
    emptyCard: {
      backgroundColor: palette.card,
      borderRadius: AppTheme.radius.md,
      padding: AppTheme.spacing.xl,
      borderWidth: 1,
      borderColor: palette.border,
    },
    emptyTitle: {
      color: palette.text,
      fontSize: 18,
      fontWeight: "700",
      marginBottom: 6,
    },
    emptyBody: {
      color: palette.muted,
      fontSize: 15,
      lineHeight: 22,
    },
    logCard: {
      backgroundColor: palette.card,
      borderRadius: AppTheme.radius.md,
      padding: AppTheme.spacing.md,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: palette.border,
    },
    logCardFeatured: {
      borderColor: palette.accent,
    },
    logTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
      gap: 8,
    },
    restaurant: {
      color: palette.text,
      fontSize: 18,
      fontWeight: "800",
      maxWidth: "72%",
    },
    rating: {
      color: palette.accent,
      fontSize: 13,
      fontWeight: "700",
    },
    menu: {
      color: palette.text,
      fontSize: 16,
      marginBottom: 6,
    },
    visitDate: {
      color: palette.muted,
      fontSize: 13,
      marginBottom: 10,
    },
    logPhoto: {
      width: "100%",
      height: 170,
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
      fontSize: 13,
      fontWeight: "700",
    },
    reviewText: {
      color: palette.muted,
      fontSize: 14,
      lineHeight: 21,
    },
  });
