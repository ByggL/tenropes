// app/(tabs)/createChannel.tsx
import ChannelForm from "@/components/channelCreaModifForm";
import { Text } from "@/components/Themed";
import Colors from "@/constants/Colors";
import { RootState } from "@/store";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";
import { useSelector } from "react-redux";
import { NewChannelData, Theme } from "../../types/types";
import { API } from "../../utils/api";

export default function CreateChannelPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  // Fetch servers to let the user select where to create the channel
  const accounts = useSelector((state: RootState) => state.servers.accounts);
  const serverList = Object.values(accounts);

  // Default to the first connected server
  const [selectedServerId, setSelectedServerId] = useState<string>(serverList.length > 0 ? serverList[0].serverId : "");

  const handleCreate = async (data: { name: string; img: string; theme: Theme }) => {
    if (!selectedServerId) {
      Alert.alert("Error", "Please add and select a server first.");
      return;
    }

    if (!data.name.trim()) {
      Alert.alert("Error", "Please enter a channel name.");
      return;
    }

    setLoading(true);
    try {
      const newChannelData: NewChannelData = {
        name: data.name,
        img: data.img || "https://placehold.co/200x200/png",
        theme: data.theme,
      };

      // Create channel on the specifically selected server
      const apiClient = new API(selectedServerId);
      await apiClient.createNewChannel(newChannelData);

      Alert.alert("Success", "Channel created successfully!", [
        {
          text: "OK",
          onPress: () => router.push("/(tabs)/channelSelectionPage"),
        },
      ]);
    } catch (error: any) {
      console.error("Creation failed", error);
      Alert.alert("Error", error.message || "Failed to create channel.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: colorScheme === "dark" ? theme.text : "#1A4D8C" }]}>
          Create New Channel
        </Text>
        <Text style={[styles.subtitle, { color: theme.subText }]}>Start a new conversation topic.</Text>

        {/* --- Server Selector UI --- */}
        {serverList.length === 0 ? (
          <Text style={{ color: "red", textAlign: "center", marginBottom: 20 }}>
            You need to add a server before creating a channel!
          </Text>
        ) : (
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: theme.subText, marginBottom: 8, marginLeft: 4 }}>
              Select Server
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {serverList.map((server) => (
                <Pressable
                  key={server.serverId}
                  onPress={() => setSelectedServerId(server.serverId)}
                  style={[
                    styles.serverChip,
                    {
                      borderColor: selectedServerId === server.serverId ? theme.tint : theme.border,
                      backgroundColor:
                        selectedServerId === server.serverId
                          ? colorScheme === "dark"
                            ? "#1A202C"
                            : "#EBF8FF"
                          : theme.cardBg,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: selectedServerId === server.serverId ? theme.tint : theme.text,
                      fontWeight: selectedServerId === server.serverId ? "bold" : "normal",
                    }}
                  >
                    {server.serverNickname}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        <ChannelForm onSubmit={handleCreate} submitLabel="Create Channel" loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { flexGrow: 1, padding: 24, justifyContent: "center" },
  title: { fontSize: 28, fontWeight: "800", textAlign: "center", marginBottom: 8 },
  subtitle: { fontSize: 16, textAlign: "center", marginBottom: 20 },
  serverChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 2,
    borderRadius: 12,
    marginRight: 10,
  },
});
