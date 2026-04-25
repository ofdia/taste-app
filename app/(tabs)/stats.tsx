import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AdBanner } from "@/components/ad-banner";
import { exportBackupData, importBackupData } from "@/services/backup";
import AsyncStorage from "@/services/storage";
import { AppTheme, Colors, Fonts } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { FoodLog } from "@/types/food-log";

type TypeCount = {
  name: string;
  count: number;
};

const EMPTY_LABEL = "아직 데이터가 없어요.";

export default function StatsScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const insets = useSafeAreaInsets();
  const palette = Colors[colorScheme];
  const styles = getStyles(palette, insets.top);

  const [totalCount, setTotalCount] = useState(0);
  const [typeCounts, setTypeCounts] = useState<TypeCount[]>([]);
  const [favoriteType, setFavoriteType] = useState(EMPTY_LABEL);
  const [favoriteShop, setFavoriteShop] = useState(EMPTY_LABEL);
  const [backupInput, setBackupInput] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const loadStats = async () => {
    try {
      const savedLogs = await AsyncStorage.getItem("foodLogs");
      const logs: FoodLog[] = savedLogs ? JSON.parse(savedLogs) : [];

      setTotalCount(logs.length);

      if (logs.length === 0) {
        setTypeCounts([]);
        setFavoriteType(EMPTY_LABEL);
        setFavoriteShop(EMPTY_LABEL);
        return;
      }

      const nextTypeCounts: Record<string, number> = {};
      const shopCounts: Record<string, number> = {};

      for (const log of logs) {
        const type = log.ramenType?.trim();
        const shop = log.restaurant?.trim();

        if (type && type !== "기타") {
          nextTypeCounts[type] = (nextTypeCounts[type] || 0) + 1;
        }

        if (shop) {
          shopCounts[shop] = (shopCounts[shop] || 0) + 1;
        }
      }

      const sortedTypes = Object.entries(nextTypeCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      setTypeCounts(sortedTypes);

      if (sortedTypes.length === 0) {
        setFavoriteType(EMPTY_LABEL);
      } else {
        const topCount = sortedTypes[0].count;
        const topTypes = sortedTypes
          .filter((item) => item.count === topCount)
          .map((item) => item.name);
        setFavoriteType(topTypes.join(", "));
      }

      const sortedShops = Object.entries(shopCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      if (sortedShops.length === 0) {
        setFavoriteShop(EMPTY_LABEL);
      } else {
        setFavoriteShop(`${sortedShops[0].name}에서 ${sortedShops[0].count}회`);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, []),
  );

  const handleExportBackup = async () => {
    try {
      const backup = await exportBackupData();
      await Share.share({
        title: "라멘로그 백업",
        message: backup,
      });
    } catch (error) {
      console.error(error);
      Alert.alert("오류", "백업을 만드는 중 문제가 발생했습니다.");
    }
  };

  const handleImportBackup = async () => {
    if (!backupInput.trim()) {
      Alert.alert("입력 확인", "복원할 백업 JSON을 붙여 넣어 주세요.");
      return;
    }

    try {
      setIsImporting(true);
      await importBackupData(backupInput.trim());
      setBackupInput("");
      await loadStats();
      Alert.alert("복원 완료", "백업 데이터로 기록을 복원했습니다.");
    } catch (error) {
      console.error(error);
      Alert.alert("오류", "백업 JSON 형식이 올바르지 않습니다.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.kicker}>취향 프로필</Text>
      <Text style={styles.title}>라멘 취향 분석</Text>
      <Text numberOfLines={1} style={styles.subtitle}>
        기록이 쌓일수록 어떤 가게와 타입을 좋아하는지 한눈에 보입니다.
      </Text>

      <View style={styles.heroGrid}>
        <View style={styles.highlightCard}>
          <Text style={styles.highlightLabel}>총 기록</Text>
          <Text style={styles.highlightValue}>{totalCount}개</Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>가장 자주 먹는 타입</Text>
          <Text style={styles.infoValue}>{favoriteType}</Text>
        </View>
        <View style={styles.infoCardWide}>
          <Text style={styles.infoLabel}>가장 자주 방문한 가게</Text>
          <Text style={styles.infoValue}>{favoriteShop}</Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>타입별 기록 분포</Text>

        {typeCounts.length === 0 ? (
          <Text style={styles.emptyText}>아직 타입별로 분석할 데이터가 없어요.</Text>
        ) : (
          typeCounts.map((item) => {
            const ratio = totalCount > 0 ? Math.max(12, (item.count / totalCount) * 100) : 12;

            return (
              <View key={item.name} style={styles.rowBlock}>
                <View style={styles.rowHeader}>
                  <Text style={styles.rowName}>{item.name}</Text>
                  <Text style={styles.rowCount}>{item.count}개</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${ratio}%` as const }]} />
                </View>
              </View>
            );
          })
        )}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>백업 및 복원</Text>
        <Text style={styles.backupDescription}>
          현재 기록을 JSON으로 공유하거나 기존 백업 JSON을 붙여 넣어 복원할 수 있습니다.
        </Text>

        <Pressable style={styles.exportButton} onPress={handleExportBackup}>
          <Text style={styles.exportButtonText}>백업 공유</Text>
        </Pressable>

        <TextInput
          style={styles.backupInput}
          placeholder="여기에 백업 JSON을 붙여 넣으세요"
          placeholderTextColor={palette.muted}
          value={backupInput}
          onChangeText={setBackupInput}
          multiline
          textAlignVertical="top"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Pressable
          style={[styles.importButton, isImporting && styles.buttonDisabled]}
          onPress={handleImportBackup}
          disabled={isImporting}
        >
          <Text style={styles.importButtonText}>
            {isImporting ? "복원 중..." : "백업 복원"}
          </Text>
        </Pressable>
      </View>

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
    kicker: {
      color: palette.tint,
      fontSize: 12,
      letterSpacing: 2,
      fontWeight: "800",
      marginBottom: 10,
    },
    title: {
      color: palette.text,
      fontSize: 30,
      fontWeight: "800",
      fontFamily: Fonts?.rounded,
      marginBottom: 8,
    },
    subtitle: {
      color: palette.muted,
      fontSize: 13,
      lineHeight: 16,
      marginBottom: 16,
    },
    heroGrid: {
      gap: 12,
      marginBottom: 12,
    },
    highlightCard: {
      backgroundColor: palette.accent,
      borderRadius: AppTheme.radius.lg,
      padding: AppTheme.spacing.lg,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    highlightLabel: {
      color: "#fbe8dc",
      fontSize: 20,
      fontWeight: "800",
    },
    highlightValue: {
      color: "#fff",
      fontSize: 20,
      fontWeight: "900",
      lineHeight: 24,
      textAlign: "right",
    },
    infoCard: {
      backgroundColor: palette.card,
      borderRadius: AppTheme.radius.md,
      padding: AppTheme.spacing.lg,
      borderWidth: 1,
      borderColor: palette.border,
    },
    infoCardWide: {
      backgroundColor: palette.surface,
      borderRadius: AppTheme.radius.md,
      padding: AppTheme.spacing.lg,
      borderWidth: 1,
      borderColor: palette.border,
    },
    infoLabel: {
      color: palette.muted,
      fontSize: 13,
      marginBottom: 8,
    },
    infoValue: {
      color: palette.text,
      fontSize: 20,
      fontWeight: "800",
    },
    sectionCard: {
      backgroundColor: palette.card,
      borderRadius: AppTheme.radius.lg,
      padding: AppTheme.spacing.lg,
      borderWidth: 1,
      borderColor: palette.border,
      ...AppTheme.shadow,
      marginBottom: 10,
    },
    sectionTitle: {
      color: palette.text,
      fontSize: 20,
      fontWeight: "800",
      marginBottom: 12,
      fontFamily: Fonts?.rounded,
    },
    emptyText: {
      color: palette.muted,
      fontSize: 15,
      lineHeight: 22,
    },
    backupDescription: {
      color: palette.muted,
      fontSize: 14,
      lineHeight: 21,
      marginBottom: 10,
    },
    exportButton: {
      backgroundColor: palette.tint,
      borderRadius: AppTheme.radius.pill,
      paddingVertical: 14,
      alignItems: "center",
      marginBottom: 8,
    },
    exportButtonText: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "800",
    },
    backupInput: {
      minHeight: 160,
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: AppTheme.radius.sm,
      backgroundColor: palette.background,
      color: palette.text,
      padding: 14,
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 8,
    },
    importButton: {
      backgroundColor: palette.accent,
      borderRadius: AppTheme.radius.pill,
      paddingVertical: 14,
      alignItems: "center",
    },
    importButtonText: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "800",
    },
    buttonDisabled: {
      opacity: 0.7,
    },
    rowBlock: {
      marginBottom: 12,
    },
    rowHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    rowName: {
      color: palette.text,
      fontSize: 16,
      fontWeight: "700",
    },
    rowCount: {
      color: palette.muted,
      fontSize: 14,
      fontWeight: "700",
    },
    progressTrack: {
      height: 12,
      backgroundColor: palette.surface,
      borderRadius: AppTheme.radius.pill,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      borderRadius: AppTheme.radius.pill,
      backgroundColor: palette.accent,
    },
  });
