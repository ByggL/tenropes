// app/add-server.tsx
import Colors from "@/constants/Colors";
import { RootState } from "@/store";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { upsertServer } from "../store/serversSlice";
import { API } from "../utils/api";

export default function AddServerModal() {
  const router = useRouter();
  const dispatch = useDispatch();

  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  const accounts = useSelector((state: RootState) => state.servers?.accounts || {});
  const hasServers = Object.keys(accounts).length > 0;

  const [mode, setMode] = useState<"login" | "register">("login");
  const [serverUrl, setServerUrl] = useState("http://example.fr");
  const [nickname, setNickname] = useState("My Server");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [registrationCode, setRegistrationCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    if (!username || !password || !serverUrl) {
      Alert.alert("Missing fields", "Please fill in all the required fields.");
      return;
    }
    
    const cleanUrl = serverUrl.trim().replace(/\/$/, "");
    setLoading(true);

    try {
      if (mode === "register") {
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters long.");
        }
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match.");
        }

        // 1. Call Register
        await API.registerServer(cleanUrl, username, password, registrationCode);
      }

      // 2. Call Login (runs for both direct login and immediately after registration)
      const response = await API.loginServer(cleanUrl, username, password);

      if (!response || !response.access_token) {
        throw new Error("Invalid response from server. Check your URL.");
      }

      dispatch(
        upsertServer({
          serverId: cleanUrl,
          serverNickname: nickname || "My Server",
          username,
          accessToken: response.access_token,
          refreshToken: response.refresh_token,
          status: "CONNECTED",
          channels: [],
        }),
      );

      if (mode === "register") {
        Alert.alert("Success", "Account created successfully!");
      }

      router.replace("/(tabs)/channelSelectionPage");
    } catch (error: any) {
      const operationName = mode === "register" ? "Registration" : "Connection";
      Alert.alert(`${operationName} Failed`, error.message || "Check the URL, username, and password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.formWrapper}>
          <Text style={[styles.title, { color: theme.text }]}>
            {mode === "login" ? "Add a Server" : "Create Account"}
          </Text>
          <Text style={[styles.subtitle, { color: theme.subText }]}>
            {mode === "login"
              ? "Connect to your Tenropes instance."
              : "Register a new profile on a Tenropes server."}
          </Text>

          {/* Segmented Control Mode Switcher */}
          <View style={styles.segmentContainer}>
            <Pressable
              style={[
                styles.segmentButton,
                mode === "login" && { backgroundColor: theme.primary || "#2f95dc" },
              ]}
              onPress={() => setMode("login")}
            >
              <Text
                style={[
                  styles.segmentText,
                  { color: mode === "login" ? "#ffffff" : theme.text },
                ]}
              >
                Sign In
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.segmentButton,
                mode === "register" && { backgroundColor: theme.primary || "#2f95dc" },
              ]}
              onPress={() => setMode("register")}
            >
              <Text
                style={[
                  styles.segmentText,
                  { color: mode === "register" ? "#ffffff" : theme.text },
                ]}
              >
                Register
              </Text>
            </Pressable>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Server URL</Text>
            <TextInput
              placeholder="http://192.168.1..."
              placeholderTextColor="#999"
              value={serverUrl}
              onChangeText={setServerUrl}
              style={[styles.input, { color: theme.text, borderColor: theme.border || "#ccc" }]}
              autoCapitalize="none"
            />
          </View>

          {mode === "register" && (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Server Invitation Code</Text>
              <TextInput
                placeholder="Secret code from host"
                placeholderTextColor="#999"
                value={registrationCode}
                onChangeText={setRegistrationCode}
                style={[styles.input, { color: theme.text, borderColor: theme.border || "#ccc" }]}
                autoCapitalize="none"
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Nickname</Text>
            <TextInput
              placeholder="Home Server"
              placeholderTextColor="#999"
              value={nickname}
              onChangeText={setNickname}
              style={[styles.input, { color: theme.text, borderColor: theme.border || "#ccc" }]}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Username</Text>
            <TextInput
              placeholder="User"
              placeholderTextColor="#999"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              style={[styles.input, { color: theme.text, borderColor: theme.border || "#ccc" }]}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Password</Text>
            <TextInput
              placeholder="••••••••"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={[styles.input, { color: theme.text, borderColor: theme.border || "#ccc" }]}
            />
          </View>

          {mode === "register" && (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Confirm Password</Text>
              <TextInput
                placeholder="••••••••"
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                style={[styles.input, { color: theme.text, borderColor: theme.border || "#ccc" }]}
              />
            </View>
          )}

          <Pressable
            onPress={handleConnect}
            style={({ pressed }) => [
              styles.btn,
              { backgroundColor: theme.primary || "#2f95dc", opacity: pressed ? 0.8 : 1 },
            ]}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.btnText}>
                {mode === "login" ? "Connect to Server" : "Create & Connect"}
              </Text>
            )}
          </Pressable>

          {hasServers && (
            <Pressable
              onPress={() => router.replace("/(tabs)/channelSelectionPage")}
              style={styles.cancelBtn}
              disabled={loading}
            >
              <Text style={[styles.cancelText, { color: theme.subText }]}>Go Back</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: "center", paddingVertical: 24 },
  formWrapper: { padding: 24, width: "100%", maxWidth: 450, alignSelf: "center" },
  title: { fontSize: 30, fontWeight: "800", marginBottom: 6 },
  subtitle: { fontSize: 16, marginBottom: 24 },
  segmentContainer: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    backgroundColor: "rgba(150,150,150,0.1)",
    marginBottom: 24,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: "700",
  },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "700", marginBottom: 6 },
  input: { borderWidth: 1, padding: 14, borderRadius: 10, fontSize: 16, backgroundColor: "rgba(150,150,150,0.05)" },
  btn: { padding: 16, alignItems: "center", borderRadius: 10, marginTop: 10 },
  btnText: { color: "#ffffff", fontWeight: "800", fontSize: 16 },
  cancelBtn: { padding: 16, alignItems: "center", marginTop: 10 },
  cancelText: { fontWeight: "600", fontSize: 14 },
});
