import * as SecureStore from "expo-secure-store";
import { secureStorage } from "../../store/secureStorage";

jest.mock("expo-secure-store", () => {
  let store: Record<string, string> = {};
  return {
    getItemAsync: jest.fn(async (key: string) => store[key] || null),
    setItemAsync: jest.fn(async (key: string, value: string) => {
      store[key] = value;
    }),
    deleteItemAsync: jest.fn(async (key: string) => {
      delete store[key];
    }),
  };
});

describe("secureStorage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should sanitize the key by replacing disallowed characters and retrieve the item", async () => {
    const key = "key:with:disallowed:chars!";
    
    await secureStorage.setItem(key, "myValue");
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith("key_with_disallowed_chars_", "myValue");

    const retrievedValue = await secureStorage.getItem(key);
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith("key_with_disallowed_chars_");
    expect(retrievedValue).toBe("myValue");
  });

  it("should sanitize the key and remove the item", async () => {
    const key = "key/to/delete";
    await secureStorage.setItem(key, "val");
    await secureStorage.removeItem(key);
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("key_to_delete");
  });
});
