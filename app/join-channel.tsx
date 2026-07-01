// app/join-channel.tsx
import Colors from "@/constants/Colors";
import { RootState } from "@/store";
import { setServerChannels } from "@/store/serversSlice";
import { API } from "@/utils/api";
import { FontAwesome } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";

export default function JoinChannelScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  const params = useLocalSearchParams();
  const serverUrlParam = params.serverUrl as string;
  const code = params.code as string;

  const [loading, setLoading] = useState(false);

  // Decode the serverUrl since it was URL-encoded in the link
  const serverUrl = serverUrlParam ? decodeURIComponent(serverUrlParam) : "";

  // Get server details from Redux
  const accounts = useSelector((state: RootState) => state.servers?.accounts || {});
  const account = serverUrl ? accounts[serverUrl] : null;

  const isServerAdded = !!account;
  const isSessionActive = account?.status === "CONNECTED";

  const handleJoin = async () => {
    if (!serverUrl || !code) {
      Alert.alert("Error", "Invalid invitation link.");
      router.replace("/(tabs)/channelSelectionPage");
      return;
    }

    setLoading(true);
    try {
      const apiClient = new API(serverUrl);
      
      // 1. Send the join request to the server
      const joinedChannel = await apiClient.joinChannelByInvite(code);

      // 2. Fetch the updated list of channels to sync the Redux store
      const updatedChannels = await apiClient.getChannels();
      dispatch(setServerChannels({ serverId: serverUrl, channels: updatedChannels }));

      Alert.alert("Joined!", `You have successfully joined #${joinedChannel.name}.`);

      // 3. Redirect to the chat room
      router.replace({
        pathname: "/(tabs)/channelPage",
        params: {
          channel: JSON.stringify(joinedChannel),
          serverUrl: serverUrl,
        },
      });
    } catch (error: any) {
      console.error("Error joining channel via invite:", error);
      Alert.alert("Failed to Join", error.message || "An error occurred while joining the channel.");
    } finally {
      setLoading(false);
    }
  };

  const handleConnectServer = () => {
    if (!serverUrl) return;
    router.replace({
      pathname: "/add-server",
      params: {
        serverUrl: serverUrl,
        token: code,
      },
    });
  };

  const handleCancel = () => {
    router.replace("/(tabs)/channelSelectionPage");
  };

  if (!serverUrl || !code) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.content}>
          <FontAwesome name="exclamation-triangle" size={64} color="#EF4444" />
          <Text style={[styles.title, { color: theme.text, marginTop: 20 }]}>Invalid Invite</Text>
          <Text style={[styles.subtitle, { color: theme.subText, textAlign: "center", marginTop: 10 }]}>
            This invitation link is invalid or broken.
          </Text>
          <Pressable
            onPress={handleCancel}
            style={[styles.btn, { backgroundColor: theme.primary, marginTop: 30 }]}
          >
            <Text style={styles.btnText}>Go to Channels</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: theme.primary + "1A" }]}>
          <FontAwesome name="envelope-open" size={48} color={theme.primary} />
        </View>

        <Text style={[styles.title, { color: theme.text, marginTop: 24 }]}>Channel Invitation</Text>
        <Text style={[styles.subtitle, { color: theme.subText, textAlign: "center", marginTop: 8 }]}>
          You have been invited to join a channel.
        </Text>

        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.subText }]}>Server</Text>
            <Text style={[styles.infoValue, { color: theme.text }]} numberOfLines={1}>
              {account?.serverNickname || serverUrl}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.subText }]}>Server URL</Text>
            <Text style={[styles.infoValue, { color: theme.text }]} numberOfLines={1}>
              {serverUrl}
            </Text>
          </View>
          {isServerAdded && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.subText }]}>Connected User</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>{account.username}</Text>
            </View>
          )}
        </View>

        {!isServerAdded ? (
          <View style={styles.actionContainer}>
            <Text style={[styles.warningText, { color: "#F59E0B", textAlign: "center", marginBottom: 16 }]}>
              You need to connect to this server first.
            </Text>
            <Pressable
              onPress={handleConnectServer}
              style={[styles.btn, { backgroundColor: theme.primary }]}
            >
              <Text style={styles.btnText}>Connect to Server</Text>
            </Pressable>
          </View>
        ) : !isSessionActive ? (
          <View style={styles.actionContainer}>
            <Text style={[styles.warningText, { color: "#F59E0B", textAlign: "center", marginBottom: 16 }]}>
              Your session on this server has expired.
            </Text>
            <Pressable
              onPress={handleConnectServer}
              style={[styles.btn, { backgroundColor: theme.primary }]}
            >
              <Text style={styles.btnText}>Log In to Server</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.actionContainer}>
            <Pressable
              onPress={handleJoin}
              style={[styles.btn, { backgroundColor: theme.primary }]}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.btnText}>Accept Invite & Join</Text>
              )}
            </Pressable>
          </View>
        )}

        <Pressable onPress={handleCancel} style={styles.cancelBtn} disabled={loading}>
          <Text style={[styles.cancelText, { color: theme.subText }]}>Cancel</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  card: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginTop: 32,
    gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "700",
    maxWidth: "70%",
  },
  actionContainer: {
    width: "100%",
    marginTop: 32,
  },
  btn: {
    width: "100%",
    padding: 16,
    alignItems: "center",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  btnText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 16,
  },
  cancelBtn: {
    padding: 16,
    alignItems: "center",
    marginTop: 16,
  },
  cancelText: {
    fontWeight: "700",
    fontSize: 15,
  },
  warningText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
