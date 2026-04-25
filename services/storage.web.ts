type StorageValue = string | null;

const storage = {
  async getItem(key: string): Promise<StorageValue> {
    if (typeof window === "undefined" || !window.localStorage) {
      return null;
    }

    return window.localStorage.getItem(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }

    window.localStorage.setItem(key, value);
  },

  async removeItem(key: string): Promise<void> {
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }

    window.localStorage.removeItem(key);
  },
};

export default storage;
