import Colors from "@/constants/Colors";
import { RootState } from "@/store";
import { ChannelMetadata, ChannelUpdateMetadata } from "@/types/types";
import { API } from "@/utils/api";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import { useSelector } from "react-redux";
import ChannelForm from "./channelCreaModifForm";

// Extend the type to expect the server information passed from ChannelSelectionPage
export type MultiServerChannel = ChannelMetadata & { serverUrl: string; serverNickname?: string };

interface ChannelCardProps {
  channelMetadata: MultiServerChannel;
  onUpdate: () => void;
}

export default function ChannelCard({ channelMetadata, onUpdate }: ChannelCardProps) {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<"menu" | "edit" | "shareChannel" | "banUser">("menu");
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [banInput, setBanInput] = useState("");

  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  // Grab the servers from Redux to check our identity
  const accounts = useSelector((state: RootState) => state.servers.accounts);

  useEffect(() => {
    if (!channelMetadata) return;

    const loadUserData = async () => {
      try {
        // Find our username for the specific server this channel lives on
        const currentUsername = accounts[channelMetadata.serverUrl]?.username;

        if (currentUsername && channelMetadata.members) {
          const myMembership = channelMetadata.members.find((m) => m.user.username === currentUsername);

          if (myMembership && myMembership.role === "admin") {
            setIsAdmin(true);
          }
        }
      } catch (error) {
        console.log("Error fetching data :", error);
      }
    };

    loadUserData();
  }, [channelMetadata, accounts]);

  // Safety return if data hasn't loaded yet to prevent crashes
  if (!channelMetadata) return null;

  const handlePress = () => {
    router.push({
      pathname: "/(tabs)/channelPage",
      params: {
        channel: JSON.stringify(channelMetadata),
        serverUrl: channelMetadata.serverUrl, // CRITICAL: Tell the chat page which server to use
        messages: JSON.stringify([]),
      },
    });
  };

  const handleLongPress = () => {
    if (isAdmin) {
      setModalMode("menu");
      setModalVisible(true);
    } else {
      Alert.alert("Authorization Error", "You are not an admin of this channel.", [{ text: "OK" }]);
    }
  };

  const handleModifyPress = () => {
    setModalMode("edit");
  };

  const handleBanPress = () => {
    setBanInput("");
    setModalMode("banUser");
  };

  const handleBanSubmit = async () => {
    if (!banInput.trim()) {
      Alert.alert("Error", "Please enter a username.");
      return;
    }

    setLoading(true);
    try {
      const apiClient = new API(channelMetadata.serverUrl);
      await apiClient.banUserFromChannel(channelMetadata.id, banInput.trim());
      Alert.alert("Success", `User ${banInput} has been banned.`);
      setModalMode("menu");
    } catch (error) {
      console.error("Ban failed", error);
      Alert.alert("Error", "Failed to ban user.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubmit = async (data: { name: string; img: string; theme: any }) => {
    setLoading(true);
    try {
      const updateData: ChannelUpdateMetadata = {
        name: data.name,
        img: data.img,
        theme: data.theme,
      };

      const apiClient = new API(channelMetadata.serverUrl);
      await apiClient.updateChannel(channelMetadata.id, updateData);

      setModalVisible(false);
      onUpdate();
      Alert.alert("Success", "Channel updated.");
    } catch (error) {
      console.error("Update failed", error);
      Alert.alert("Error", "Failed to update channel.");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {};

  const handleDelete = async () => {
    try {
      const apiClient = new API(channelMetadata.serverUrl);
      await apiClient.deleteChannel(channelMetadata.id);
      setModalVisible(false);
      onUpdate();
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  const renderModalContent = () => {
    switch (modalMode) {
      case "menu":
        return (
          <>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Channel Options</Text>
            <Text style={[styles.modalSubtitle, { color: theme.subText }]}>What do you want to do?</Text>

            <Pressable
              style={[styles.modalButton, styles.buttonModify]}
              onPress={handleModifyPress}
              disabled={!isAdmin}
            >
              <Text style={styles.textModify}>Modify Channel</Text>
            </Pressable>

            <Pressable style={[styles.modalButton, styles.buttonBan]} onPress={handleBanPress} disabled={!isAdmin}>
              <Text style={styles.textBan}>Ban User</Text>
            </Pressable>

            <Pressable style={[styles.modalButton, styles.buttonDelete]} onPress={handleDelete} disabled={!isAdmin}>
              <Text style={styles.textDelete}>Delete Channel</Text>
            </Pressable>

            <Pressable style={[styles.modalButton, styles.buttonShare]} onPress={handleShare}>
              <Text style={styles.textShare}>Share channel through link</Text>
            </Pressable>

            <Pressable style={[styles.modalButton, styles.buttonCancel]} onPress={() => setModalVisible(false)}>
              <Text style={styles.textCancel}>Cancel</Text>
            </Pressable>
          </>
        );

      case "banUser":
        return (
          <>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Ban User</Text>
            <Text style={[styles.modalSubtitle, { color: theme.subText, marginBottom: 15 }]}>
              Enter the username to ban from this channel.
            </Text>

            <TextInput
              style={[
                styles.input,
                {
                  color: theme.text,
                  borderColor: theme.inputBorder,
                  backgroundColor: theme.inputBg,
                },
              ]}
              placeholder="Username"
              placeholderTextColor={theme.subText}
              value={banInput}
              onChangeText={setBanInput}
              autoCapitalize="none"
            />

            <Pressable
              style={[styles.modalButton, styles.buttonBan, { marginTop: 10 }]}
              onPress={handleBanSubmit}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#D32F2F" /> : <Text style={styles.textBan}>Confirm Ban</Text>}
            </Pressable>

            <Pressable
              style={[styles.modalButton, styles.buttonCancel]}
              onPress={() => setModalMode("menu")}
              disabled={loading}
            >
              <Text style={styles.textCancel}>Back</Text>
            </Pressable>
          </>
        );

      case "edit":
        return (
          <>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Channel</Text>
            <ChannelForm
              initialData={{
                name: channelMetadata?.name || "",
                img: channelMetadata?.img || "",
                theme: channelMetadata?.theme,
              }}
              onSubmit={handleUpdateSubmit}
              submitLabel="Save Changes"
              onCancel={() => setModalMode("menu")}
              loading={loading}
            />
          </>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.cardWrapper}>
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable
            style={[styles.modalContent, { backgroundColor: theme.cardBg }]}
            onPress={(e) => e.stopPropagation()}
          >
            {renderModalContent()}
          </Pressable>
        </Pressable>
      </Modal>

      <Pressable
        onPress={handlePress}
        onLongPress={handleLongPress}
        style={({ pressed }) => [
          styles.cardContainer,
          {
            backgroundColor: theme.cardBg,
            borderColor: theme.inputBorder,
          },
          pressed && { opacity: 0.7, backgroundColor: theme.inputBg },
        ]}
      >
        <Image
          source={{ uri: channelMetadata?.img || "https://placehold.co/50x50/png" }}
          style={styles.cardImage}
          resizeMode="cover"
        />
        <View style={styles.textContainer}>
          <Text style={[styles.channelName, { color: theme.text }]} numberOfLines={1}>
            {channelMetadata?.name || "Loading..."}
          </Text>
          <Text style={[styles.lastMessage, { color: theme.subText }]} numberOfLines={1}>
            Tap to view messages
          </Text>
        </View>
        <FontAwesome name="chevron-right" size={14} color={theme.subText} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: { paddingHorizontal: 20, paddingVertical: 8 },
  cardContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
  },
  cardImage: { width: 50, height: 50, borderRadius: 14, backgroundColor: "#E1E4E8" },
  textContainer: { flex: 1, marginLeft: 15, justifyContent: "center" },
  channelName: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  lastMessage: { fontSize: 13 },
  modalOverlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0, 0, 0, 0.5)" },
  modalContent: {
    width: "85%",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  modalSubtitle: { fontSize: 16, marginBottom: 20 },
  modalButton: { width: "100%", padding: 12, borderRadius: 12, alignItems: "center", marginBottom: 10 },
  buttonModify: { backgroundColor: "#E3F2FD" },
  textModify: { color: "#1E88E5", fontWeight: "bold", fontSize: 16 },
  buttonDelete: { backgroundColor: "#FFEBEE" },
  textDelete: { color: "#D32F2F", fontWeight: "bold", fontSize: 16 },
  buttonShare: { backgroundColor: "#8af7cd" },
  textShare: { color: "#1c9c22", fontWeight: "bold", fontSize: 16 },
  buttonCancel: { marginTop: 5 },
  textCancel: { color: "#999", fontSize: 14 },
  buttonBan: { backgroundColor: "#FFF3E0" },
  textBan: { color: "#E65100", fontWeight: "bold", fontSize: 16 },
  input: { width: "100%", padding: 12, borderWidth: 1, borderRadius: 12, fontSize: 16, marginBottom: 10 },
});
