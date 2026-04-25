import AsyncStorage from "@/services/storage";
import type { FoodLog } from "@/types/food-log";

const FOOD_LOGS_KEY = "foodLogs";
const USER_SHOPS_KEY = "savedRamenShops";
const FAVORITE_SHOPS_KEY = "favoriteRamenShops";
const BACKUP_VERSION = 1;

type BackupPayload = {
  version: number;
  exportedAt: string;
  foodLogs: FoodLog[];
  savedRamenShops: string[];
  favoriteRamenShops: string[];
};

const isFoodLog = (value: unknown): value is FoodLog => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const log = value as Record<string, unknown>;

  return (
    typeof log.id === "string" &&
    typeof log.restaurant === "string" &&
    typeof log.menu === "string" &&
    typeof log.createdAt === "string"
  );
};

export const exportBackupData = async () => {
  const [foodLogsRaw, savedShopsRaw, favoriteShopsRaw] = await Promise.all([
    AsyncStorage.getItem(FOOD_LOGS_KEY),
    AsyncStorage.getItem(USER_SHOPS_KEY),
    AsyncStorage.getItem(FAVORITE_SHOPS_KEY),
  ]);

  const foodLogs = foodLogsRaw ? (JSON.parse(foodLogsRaw) as unknown[]) : [];
  const savedRamenShops = savedShopsRaw ? (JSON.parse(savedShopsRaw) as unknown[]) : [];
  const favoriteRamenShops = favoriteShopsRaw ? (JSON.parse(favoriteShopsRaw) as unknown[]) : [];

  const payload: BackupPayload = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    foodLogs: foodLogs.filter(isFoodLog),
    savedRamenShops: savedRamenShops.filter((shop): shop is string => typeof shop === "string"),
    favoriteRamenShops: favoriteRamenShops.filter((shop): shop is string => typeof shop === "string"),
  };

  return JSON.stringify(payload, null, 2);
};

export const importBackupData = async (rawPayload: string) => {
  const parsed = JSON.parse(rawPayload) as Partial<BackupPayload>;

  if (!Array.isArray(parsed.foodLogs) || !parsed.foodLogs.every(isFoodLog)) {
    throw new Error("기록 데이터 형식이 올바르지 않습니다.");
  }

  if (
    !Array.isArray(parsed.savedRamenShops) ||
    !parsed.savedRamenShops.every((shop) => typeof shop === "string")
  ) {
    throw new Error("저장된 가게 데이터 형식이 올바르지 않습니다.");
  }

  if (
    parsed.favoriteRamenShops !== undefined &&
    (!Array.isArray(parsed.favoriteRamenShops) ||
      !parsed.favoriteRamenShops.every((shop) => typeof shop === "string"))
  ) {
    throw new Error("찜한 가게 데이터 형식이 올바르지 않습니다.");
  }

  await Promise.all([
    AsyncStorage.setItem(FOOD_LOGS_KEY, JSON.stringify(parsed.foodLogs)),
    AsyncStorage.setItem(USER_SHOPS_KEY, JSON.stringify(parsed.savedRamenShops)),
    AsyncStorage.setItem(
      FAVORITE_SHOPS_KEY,
      JSON.stringify(parsed.favoriteRamenShops ?? []),
    ),
  ]);
};
