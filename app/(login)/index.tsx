// @ts-ignore
import logo from "@/assets/images/tenropes_proposition.png";
import api from "@/utils/api";
import { getJwt } from "@/utils/jwt";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

// Assuming you are in app/(login)/loginPage.tsx
export default function LoginScreen() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [wrongIdentifiers, setWrongIdentifiers] = useState(false);

  // State to handle initial token check
  const [isCheckingToken, setIsCheckingToken] = useState(true);

  useEffect(() => {
    const checkToken = async () => {
      try {
        // Fetch the stored object
        const data: any = await getJwt();
        const { token, timestamp } = data;
        // console.log("oupsi");
        if (token && timestamp) {
          const now = Date.now();
          const threeHoursInMs = 3 * 60 * 60 * 1000;

          // Check if token is less than 3 hours old
          if (now - timestamp < threeHoursInMs) {
            console.log("Valid session found, redirecting...");
            router.replace({
              pathname: "/(tabs)/channelSelectionPage",
              params: { token: token }, // Transmitting the token
            });
            return;
          }
        }
      } catch (error) {
        console.log("Error checking token:", error);
      } finally {
        // Stop checking and show login form if no valid token found
        setIsCheckingToken(false);
      }
    };

    checkToken();
  }, []);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }

    setLoading(true);

    // --- 1. Simulate API/Auth Logic ---
    console.log(`Attempting login for: ${username}`);

    try {
      const result = await api.login(username, password);
      console.log(result);
      console.log("Login successful. Simulating navigation to main content.");
      console.log(username);
      await AsyncStorage.setItem("currentUsername", username);
      setWrongIdentifiers(false);
      setLoading(false);
      router.replace("/(tabs)/channelSelectionPage");
    } catch (error) {
      console.log(error);
      setWrongIdentifiers(true);
      setPassword("");
      setLoading(false);
    }

    // Add a small delay to simulate network latency for better UX
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // // --- 2. Log Success Message ---
  };

  // Show a loading spinner while we check the token
  if (isCheckingToken) {
    return (
      <View style={[styles.container, { alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.form}>
        <Text style={styles.title}>Welcome Back </Text>
        <Image source={logo} style={styles.image} />
        {/* Email Input */}
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          keyboardType="default"
          autoCapitalize="none"
          placeholderTextColor="#999"
          editable={!loading}
        />

        {/* Password Input */}
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor="#999"
          editable={!loading}
        />

        {/* Error Message */}
        <Text style={styles.errorMessage}>
          {wrongIdentifiers ? "Wrong username and/or password" : ""}
        </Text>
        {/* Login Button */}
        <Pressable
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: loading || pressed ? "#1A4D8C" : "#007AFF" },
          ]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Logging in..." : "Sign In"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  errorMessage: {
    color: "red",
    paddingHorizontal: 15,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 30,
    backgroundColor: "#f5f5f5",
  },
  image: {
    width: 250,
    height: 150,
    alignSelf: "center",
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "gray",
    resizeMode: "cover",
  },
  form: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  input: {
    height: 50,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: "#fafafa",
    color: "#333",
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  link: {
    marginTop: 20,
    padding: 10,
    alignSelf: "center",
  },
  linkText: {
    color: "#007AFF",
    fontSize: 14,
  },
});
