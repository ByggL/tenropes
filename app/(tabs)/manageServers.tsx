// app/(tabs)/manageServers.tsx
import Colors from "@/constants/Colors";
import { RootState } from "@/store";
import { API } from "@/utils/api";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, useColorScheme, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { removeServer, updateServerNickname } from "../../store/serversSlice";

export default function ManageServersPage() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const dispatch = useDispatch();

  const accounts = useSelector((state: RootState) => state.servers.accounts);
  const serverList = Object.values(accounts);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleEditStart = (serverId: string, currentName: string) => {
    setEditingId(serverId);
    setEditName(currentName);
  };

  const handleEditSave = (serverId: string) => {
    if (editName.trim()) {
      dispatch(updateServerNickname({ serverId, newNickname: editName.trim() }));
    }
    setEditingId(null);
  };

  const handleDelete = (serverId: string, serverNickname: string) => {
    Alert.alert("Disconnect Server", `Log out and remove "${serverNickname}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Disconnect",
        style: "destructive",
        onPress: async () => {
          try {
            // 1. Attempt to tell the backend we are leaving
            const server = accounts[serverId];
            const apiClient = new API(serverId);
            await apiClient.logout().catch(() => console.log("Server already unreachable"));

            // 2. Remove from Redux
            dispatch(removeServer(serverId));

            // 3. If no servers left, go to login
            if (Object.keys(accounts).length <= 1) {
              router.replace("/add-server");
            }
          } catch (e) {
            console.error(e);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.header, { color: theme.text }]}>Manage Servers</Text>

      {serverList.length === 0 ? (
        <Text style={{ color: theme.subText, textAlign: "center", marginTop: 40 }}>No servers configured.</Text>
      ) : (
        <FlatList
          data={serverList}
          keyExtractor={(item) => item.serverId}
          contentContainerStyle={{ padding: 20 }}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border || "#eee" }]}>
              <View style={styles.infoContainer}>
                {editingId === item.serverId ? (
                  <TextInput
                    style={[styles.editInput, { color: theme.text, borderColor: theme.tint }]}
                    value={editName}
                    onChangeText={setEditName}
                    autoFocus
                    onSubmitEditing={() => handleEditSave(item.serverId)}
                    onBlur={() => handleEditSave(item.serverId)}
                  />
                ) : (
                  <Text style={[styles.nickname, { color: theme.text }]}>{item.serverNickname}</Text>
                )}
                <Text style={[styles.url, { color: theme.subText }]}>{item.serverId}</Text>
                <Text style={[styles.url, { color: theme.subText, fontSize: 11 }]}>User: {item.username}</Text>
              </View>

              <View style={styles.actionContainer}>
                {editingId === item.serverId ? (
                  <Pressable style={styles.iconBtn} onPress={() => handleEditSave(item.serverId)}>
                    <FontAwesome name="check" size={20} color={theme.tint || "#007AFF"} />
                  </Pressable>
                ) : (
                  <Pressable style={styles.iconBtn} onPress={() => handleEditStart(item.serverId, item.serverNickname)}>
                    <FontAwesome name="pencil" size={20} color={theme.subText} />
                  </Pressable>
                )}

                <Pressable style={styles.iconBtn} onPress={() => handleDelete(item.serverId, item.serverNickname)}>
                  <FontAwesome name="trash" size={20} color="#EF4444" />
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { fontSize: 28, fontWeight: "900", paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 },
  card: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  infoContainer: { flex: 1, marginRight: 10 },
  nickname: { fontSize: 18, fontWeight: "bold", marginBottom: 4 },
  url: { fontSize: 13, marginBottom: 2 },
  editInput: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
    borderWidth: 1,
    borderRadius: 6,
    padding: 4,
    paddingHorizontal: 8,
  },
  actionContainer: { flexDirection: "row", gap: 15 },
  iconBtn: { padding: 5 },
});
