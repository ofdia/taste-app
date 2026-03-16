import SQLiteStorage from "expo-sqlite/kv-store";

type StorageValue = string | null;

const getWebStorage = () => {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }

  return null;
};

const storage = {
  async getItem(key: string): Promise<StorageValue> {
    const webStorage = getWebStorage();
    if (webStorage) {
      return webStorage.getItem(key);
    }

    return SQLiteStorage.getItem(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    const webStorage = getWebStorage();
    if (webStorage) {
      webStorage.setItem(key, value);
      return;
    }

    await SQLiteStorage.setItem(key, value);
  },

  async removeItem(key: string): Promise<void> {
    const webStorage = getWebStorage();
    if (webStorage) {
      webStorage.removeItem(key);
      return;
    }

    await SQLiteStorage.removeItem(key);
  },
};

export default storage;
