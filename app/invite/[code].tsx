// app/invite/[code].tsx
import Colors from "@/constants/Colors";
import { RootState } from "@/store";
import { setServerChannels } from "@/store/serversSlice";
import { API } from "@/utils/api";
import { FontAwesome } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";

export default function ResolveInviteScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  const params = useLocalSearchParams();
  const code = params.code as string;

  const [resolving, setResolving] = useState(true);
  const [joining, setJoining] = useState(false);
  const [resolvedServerUrl, setResolvedServerUrl] = useState<string | null>(null);
  const [resolvedServerNickname, setResolvedServerNickname] = useState<string | null>(null);
  const [channelInfo, setChannelInfo] = useState<{ channelName: string; channelImg?: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Get all added servers from Redux
  const accounts = useSelector((state: RootState) => state.servers?.accounts || {});
  const serverList = useMemo(() => Object.values(accounts), [accounts]);

  useEffect(() => {
    if (!code) {
      setErrorMsg("No invitation code provided.");
      setResolving(false);
      return;
    }

    const findServerForInvite = async () => {
      if (serverList.length === 0) {
        setErrorMsg("You have no servers configured. Please connect to a server first.");
        setResolving(false);
        return;
      }

      setErrorMsg(null);
      
      // Iterate through all active servers to find which one has this invite code
      for (const account of serverList) {
        try {
          const apiClient = new API(account.serverId);
          const res = await apiClient.checkInviteCode(code);
          
          if (res.exists) {
            setResolvedServerUrl(account.serverId);
            setResolvedServerNickname(account.serverNickname);
            setChannelInfo({
              channelName: res.channelName,
              channelImg: res.channelImg,
            });
            setResolving(false);
            return;
          }
        } catch {
          // If this server doesn't have the invite or fails, we continue checking other servers
          console.log(`Invite code not found on server ${account.serverId}`);
        }
      }

      setErrorMsg("This invitation code could not be resolved on any of your connected servers.");
      setResolving(false);
    };

    findServerForInvite();
  }, [code, serverList]);

  const handleJoin = async () => {
    if (!resolvedServerUrl || !code) return;

    setJoining(true);
    try {
      const apiClient = new API(resolvedServerUrl);
      
      // 1. Accept and join
      const joinedChannel = await apiClient.joinChannelByInvite(code);

      // 2. Fetch updated channels list
      const updatedChannels = await apiClient.getChannels();
      dispatch(setServerChannels({ serverId: resolvedServerUrl, channels: updatedChannels }));

      Alert.alert("Joined!", `You have joined #${joinedChannel.name}.`);

      // 3. Redirect to the chat room
      router.replace({
        pathname: "/(tabs)/channelPage",
        params: {
          channel: JSON.stringify(joinedChannel),
          serverUrl: resolvedServerUrl,
        },
      });
    } catch (error: any) {
      console.error("Error joining channel:", error);
      Alert.alert("Error Joining", error.message || "An error occurred while joining the channel.");
    } finally {
      setJoining(false);
    }
  };

  const handleCancel = () => {
    router.replace("/(tabs)/channelSelectionPage");
  };

  if (resolving) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.statusText, { color: theme.text, marginTop: 16 }]}>
            Resolving invitation code...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (errorMsg) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.content}>
          <FontAwesome name="exclamation-triangle" size={64} color="#EF4444" />
          <Text style={[styles.title, { color: theme.text, marginTop: 20 }]}>Invite Error</Text>
          <Text style={[styles.subtitle, { color: theme.subText, textAlign: "center", marginTop: 10 }]}>
            {errorMsg}
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

        <Text style={[styles.title, { color: theme.text, marginTop: 24 }]}>Accept Invitation</Text>
        <Text style={[styles.subtitle, { color: theme.subText, textAlign: "center", marginTop: 8 }]}>
          You have been invited to join a channel.
        </Text>

        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          {channelInfo?.channelImg && (
            <Image source={{ uri: channelInfo.channelImg }} style={styles.channelImg} />
          )}
          <Text style={[styles.channelNameText, { color: theme.text }]}>
            #{channelInfo?.channelName}
          </Text>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.subText }]}>Server</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>
              {resolvedServerNickname}
            </Text>
          </View>
        </View>

        <View style={styles.actionContainer}>
          <Pressable
            onPress={handleJoin}
            style={[styles.btn, { backgroundColor: theme.primary }]}
            disabled={joining}
          >
            {joining ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.btnText}>Accept & Join Channel</Text>
            )}
          </Pressable>
        </View>

        <Pressable onPress={handleCancel} style={styles.cancelBtn} disabled={joining}>
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
  statusText: {
    fontSize: 16,
    fontWeight: "600",
  },
  card: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    marginTop: 32,
    alignItems: "center",
  },
  channelImg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 16,
    backgroundColor: "#ccc",
  },
  channelNameText: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 16,
  },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "700",
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
});
