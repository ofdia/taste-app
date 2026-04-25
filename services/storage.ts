import SQLiteStorage from "expo-sqlite/kv-store";

type StorageValue = string | null;

const storage = {
  async getItem(key: string): Promise<StorageValue> {
    return SQLiteStorage.getItem(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    await SQLiteStorage.setItem(key, value);
  },

  async removeItem(key: string): Promise<void> {
    await SQLiteStorage.removeItem(key);
  },
};

export default storage;
