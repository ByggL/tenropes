import AsyncStorage from "@react-native-async-storage/async-storage";

export async function storeJwt(jwtString: string): Promise<void> {
  try {
    await AsyncStorage.setItem("jwt_token", jwtString);
  } catch (e) {
    throw new Error("Failed to store JWT token");
  }
}

export async function getJwt(): Promise<string> {
  try {
    const value = await AsyncStorage.getItem("jwt_token");
    if (value !== null) {
      return value;
    } else return "";
  } catch (e) {
    throw new Error("Failed ton retrieve JWT token");
  }
}
