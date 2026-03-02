// app/(tabs)/channelSelectionPage.tsx
import ChannelCard from "@/components/channelCard";
import Colors from "@/constants/Colors";
import { RootState } from "@/store";
import { API } from "@/utils/api";
import { FontAwesome } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { markSessionExpired, setServerChannels, setServerStatus } from "../../store/serversSlice";

export default function ChannelSelectionPage() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const dispatch = useDispatch();

  const accounts = useSelector((state: RootState) => state.servers?.accounts || {});
  const serverList = Object.values(accounts);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchServerData = async (serverId: string) => {
    dispatch(setServerStatus({ serverId, status: "LOADING" }));
    try {
      const apiClient = new API(serverId);
      const channels = await apiClient.getChannels();
      dispatch(setServerChannels({ serverId, channels }));
    } catch (error: any) {
      console.error(`Error fetching for ${serverId}:`, error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        dispatch(markSessionExpired(serverId));
      } else {
        dispatch(setServerStatus({ serverId, status: "OFFLINE" }));
      }
    }
  };

  const refreshAll = useCallback(async () => {
    if (serverList.length === 0) return;
    setIsRefreshing(true);
    await Promise.all(serverList.map((s) => fetchServerData(s.serverId)));
    setIsRefreshing(false);
  }, [serverList.length]);

  useFocusEffect(
    useCallback(() => {
      refreshAll();
    }, []),
  );

  const renderServerGroup = ({ item: server }: { item: any }) => {
    const statusColor =
      server.status === "CONNECTED"
        ? "#4ADE80"
        : server.status === "OFFLINE"
          ? "#EF4444"
          : server.status === "SESSION_EXPIRED"
            ? "#F59E0B"
            : "#9CA3AF";

    return (
      <View style={[styles.serverContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <View style={styles.serverHeader}>
          <View style={styles.row}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.serverName, { color: theme.text }]}>{server.serverNickname}</Text>
          </View>
          {server.status === "LOADING" && <ActivityIndicator size="small" color={theme.tint} />}
        </View>

        {server.status === "CONNECTED" && server.channels && server.channels.length > 0 ? (
          server.channels.map((channel: any) => (
            <Pressable
              key={channel.id}
              onPress={() => {
                // NAVIGATION FIX: This sends the user to the Chat Room
                router.push({
                  pathname: "/(tabs)/channelPage",
                  params: {
                    channel: JSON.stringify(channel),
                    serverUrl: server.serverId,
                  },
                });
              }}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <ChannelCard channelMetadata={{ ...channel, serverUrl: server.serverId }} onUpdate={refreshAll} />
            </Pressable>
          ))
        ) : (
          <View style={styles.statusBox}>
            <Text style={{ color: theme.subText, fontSize: 13 }}>
              {server.status === "OFFLINE"
                ? "Server unreachable"
                : server.status === "SESSION_EXPIRED"
                  ? "Session expired"
                  : server.status === "LOADING"
                    ? "Connecting..."
                    : "No channels found"}
            </Text>
            {server.status !== "LOADING" && server.status !== "CONNECTED" && (
              <Pressable onPress={() => fetchServerData(server.serverId)} style={styles.retryBtn}>
                <Text style={{ color: theme.tint, fontWeight: "bold" }}>Retry</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Channels</Text>
        <Pressable onPress={() => router.push("/add-server")}>
          <FontAwesome name="plus-circle" size={28} color={theme.tint} />
        </Pressable>
      </View>

      <FlatList
        data={serverList}
        renderItem={renderServerGroup}
        keyExtractor={(item) => item.serverId}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refreshAll} tintColor={theme.tint} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={{ color: theme.subText }}>No servers added yet.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20 },
  title: { fontSize: 28, fontWeight: "900" },
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },
  serverContainer: { borderRadius: 16, padding: 12, marginBottom: 16, borderWidth: 1 },
  serverHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  row: { flexDirection: "row", alignItems: "center" },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  serverName: { fontSize: 18, fontWeight: "800" },
  statusBox: { padding: 10, alignItems: "center" },
  retryBtn: { marginTop: 8 },
  emptyContainer: { alignItems: "center", marginTop: 100 },
});
