import AsyncStorage from "@/services/storage";

const FAVORITE_SHOPS_KEY = "favoriteRamenShops";

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

export const getFavoriteRamenShops = async () => {
  const saved = await AsyncStorage.getItem(FAVORITE_SHOPS_KEY);
  const parsed: string[] = saved ? JSON.parse(saved) : [];
  return dedupeShops(parsed);
};

export const isFavoriteRamenShop = async (shopName: string) => {
  const normalized = normalizeShopName(shopName);

  if (!normalized) {
    return false;
  }

  const favorites = await getFavoriteRamenShops();
  return favorites.some((shop) => shop.toLocaleLowerCase("ko-KR") === normalized.toLocaleLowerCase("ko-KR"));
};

export const addFavoriteRamenShop = async (shopName: string) => {
  const normalized = normalizeShopName(shopName);

  if (!normalized) {
    return;
  }

  const favorites = await getFavoriteRamenShops();
  const next = dedupeShops([normalized, ...favorites]);
  await AsyncStorage.setItem(FAVORITE_SHOPS_KEY, JSON.stringify(next));
};

export const removeFavoriteRamenShop = async (shopName: string) => {
  const normalized = normalizeShopName(shopName);
  const favorites = await getFavoriteRamenShops();
  const next = favorites.filter(
    (shop) => shop.toLocaleLowerCase("ko-KR") !== normalized.toLocaleLowerCase("ko-KR"),
  );
  await AsyncStorage.setItem(FAVORITE_SHOPS_KEY, JSON.stringify(next));
};

export const toggleFavoriteRamenShop = async (shopName: string) => {
  const favorite = await isFavoriteRamenShop(shopName);

  if (favorite) {
    await removeFavoriteRamenShop(shopName);
    return false;
  }

  await addFavoriteRamenShop(shopName);
  return true;
};
