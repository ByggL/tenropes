import AsyncStorage from "@react-native-async-storage/async-storage";

export async function storeJwt(jwtString: string): Promise<void> {
  try {
    await AsyncStorage.setItem(
      "jwt_token",
      JSON.stringify({ token: jwtString, timestamp: Date.now() }),
    );
  } catch (e) {
    throw new Error("Failed to store JWT token");
  }
}

export async function getJwt(): Promise<{
  token: string;
  timestamp: number;
} | null> {
  try {
    const value = await AsyncStorage.getItem("jwt_token");
    if (value !== null) {
      return JSON.parse(value);
    } else return null;
  } catch (e) {
    throw new Error("Failed to retrieve JWT token");
  }
}
