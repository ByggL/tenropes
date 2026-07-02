import AsyncStorage from "@react-native-async-storage/async-storage";
import { storeJwt, getJwt, clearJwt } from "../../utils/jwt";

jest.mock("@react-native-async-storage/async-storage", () => {
  let store: Record<string, string> = {};
  return {
    setItem: jest.fn(async (key: string, value: string) => {
      store[key] = value;
    }),
    getItem: jest.fn(async (key: string) => {
      return store[key] || null;
    }),
    removeItem: jest.fn(async (key: string) => {
      delete store[key];
    }),
  };
});

describe("JWT storage utility", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("storeJwt", () => {
    it("should store the access token and refresh token with a timestamp", async () => {
      const accessToken = "at_token";
      const refreshToken = "rt_token";

      await storeJwt(accessToken, refreshToken);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        "jwt_token",
        expect.stringContaining('"accessToken":"at_token"')
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        "jwt_token",
        expect.stringContaining('"refreshToken":"rt_token"')
      );
    });

    it("should throw an error if AsyncStorage fails", async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error("Storage error"));

      await expect(storeJwt("at", "rt")).rejects.toThrow("Failed to store JWT tokens");
    });
  });

  describe("getJwt", () => {
    it("should return parsed tokens if they exist", async () => {
      const mockData = {
        accessToken: "at",
        refreshToken: "rt",
        timestamp: Date.now(),
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockData));

      const result = await getJwt();
      expect(result).toEqual(mockData);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith("jwt_token");
    });

    it("should return null if tokens do not exist", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const result = await getJwt();
      expect(result).toBeNull();
    });

    it("should throw an error if AsyncStorage fails", async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error("Storage error"));

      await expect(getJwt()).rejects.toThrow("Failed to retrieve JWT tokens");
    });
  });

  describe("clearJwt", () => {
    it("should call AsyncStorage.removeItem to clear tokens", async () => {
      await clearJwt();
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith("jwt_token");
    });
  });
});
