// utils/jwt.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

export async function storeJwt(
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      "jwt_token",
      JSON.stringify({ accessToken, refreshToken, timestamp: Date.now() }),
    );
  } catch (e) {
    throw new Error("Failed to store JWT tokens");
  }
}

export async function getJwt(): Promise<{
  accessToken: string;
  refreshToken: string;
  timestamp: number;
} | null> {
  try {
    const value = await AsyncStorage.getItem("jwt_token");
    if (value !== null) {
      return JSON.parse(value);
    } else return null;
  } catch (e) {
    throw new Error("Failed to retrieve JWT tokens");
  }
}

export async function clearJwt(): Promise<void> {
  await AsyncStorage.removeItem("jwt_token");
}
