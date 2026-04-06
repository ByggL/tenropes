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

  const [serverUrl, setServerUrl] = useState("http://example.fr");
  const [nickname, setNickname] = useState("My Server");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    if (!username || !password || !serverUrl) return;
    setLoading(true);

    try {
      const cleanUrl = serverUrl.trim().replace(/\/$/, "");
      const response = await API.loginServer(cleanUrl, username, password);

      if (!response || !response.access_token) {
        throw new Error("Invalid response from server. Check your URL.");
      }

      // FIX: Added 'channels: []' to satisfy the ServerAccount interface
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

      router.replace("/(tabs)/channelSelectionPage");
    } catch (error: any) {
      Alert.alert("Connection Failed", error.message || "Check the URL, username, and password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={styles.formWrapper}>
        <Text style={[styles.title, { color: theme.text }]}>Add a Server</Text>
        <Text style={[styles.subtitle, { color: theme.subText }]}>Connect to your Tenropes instance.</Text>

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

        <Pressable
          onPress={handleConnect}
          style={({ pressed }) => [styles.btn, { backgroundColor: "#2f95dc", opacity: pressed ? 0.8 : 1 }]}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.btnText}>Connect to Server</Text>}
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center" },
  formWrapper: { padding: 24, width: "100%", maxWidth: 450, alignSelf: "center" },
  title: { fontSize: 30, fontWeight: "800", marginBottom: 6 },
  subtitle: { fontSize: 16, marginBottom: 24 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "700", marginBottom: 6 },
  input: { borderWidth: 1, padding: 14, borderRadius: 10, fontSize: 16, backgroundColor: "rgba(150,150,150,0.05)" },
  btn: { padding: 16, alignItems: "center", borderRadius: 10, marginTop: 10 },
  btnText: { color: "#ffffff", fontWeight: "800", fontSize: 16 },
  cancelBtn: { padding: 16, alignItems: "center", marginTop: 10 },
  cancelText: { fontWeight: "600", fontSize: 14 },
});
