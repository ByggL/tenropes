// store/secureStorage.ts
import * as SecureStore from "expo-secure-store";

// SecureStore explicitly forbids colons, which Redux Persist uses.
// This sanitizes the key so it doesn't crash the app.
const sanitize = (key: string) => key.replace(/[^a-zA-Z0-9.\-_]/g, "_");

export const secureStorage = {
  getItem: async (key: string) => await SecureStore.getItemAsync(sanitize(key)),
  setItem: async (key: string, value: string) => await SecureStore.setItemAsync(sanitize(key), value),
  removeItem: async (key: string) => await SecureStore.deleteItemAsync(sanitize(key)),
};
