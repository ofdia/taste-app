import AsyncStorage from "@/services/storage";

import { RAMEN_SHOPS } from "@/data/ramenShops";

const USER_SHOP_STORAGE_KEY = "savedRamenShops";

const normalizeShopName = (name: string) => name.trim().replace(/\s+/g, " ");

const dedupeShops = (shops: string[]) => {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const shop of shops) {
    const normalized = normalizeShopName(shop);
    const key = normalized.toLocaleLowerCase("ko-KR");

    if (!normalized || seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(normalized);
  }

  return result;
};

export const saveUserRamenShop = async (shopName: string) => {
  const normalized = normalizeShopName(shopName);

  if (!normalized) {
    return;
  }

  const saved = await AsyncStorage.getItem(USER_SHOP_STORAGE_KEY);
  const parsed: string[] = saved ? JSON.parse(saved) : [];
  const next = dedupeShops([normalized, ...parsed]);
  await AsyncStorage.setItem(USER_SHOP_STORAGE_KEY, JSON.stringify(next));
};

export const getSavedRamenShops = async () => {
  const saved = await AsyncStorage.getItem(USER_SHOP_STORAGE_KEY);
  const parsed: string[] = saved ? JSON.parse(saved) : [];
  return dedupeShops(parsed);
};

export const searchRamenShops = async (keyword: string) => {
  const normalizedKeyword = normalizeShopName(keyword);

  if (!normalizedKeyword) {
    return [];
  }

  const savedShops = await getSavedRamenShops();

  return dedupeShops([...savedShops, ...RAMEN_SHOPS])
    .filter((shop) =>
      shop.toLocaleLowerCase("ko-KR").includes(normalizedKeyword.toLocaleLowerCase("ko-KR")),
    )
    .slice(0, 8);
};
