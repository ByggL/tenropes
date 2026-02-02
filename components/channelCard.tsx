import Colors from "@/constants/Colors"; // 3. Import Colors
import { ChannelMetadata, ChannelUpdateMetadata } from "@/types/types";
import api from "@/utils/api";
import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  // 1. Remove standard Text/View imports to avoid conflict if you use Themed versions,
  // or rename them. Here I stick to standard RN imports but apply theme styles manually
  // to ensure I don't break your structure.
  Text,
  View,
  useColorScheme, // 2. Import hook
} from "react-native";
import ChannelForm from "./channelCreaModifForm";

interface ChannelCardProps {
  channelMetadata: ChannelMetadata;
  onUpdate: () => void;
}

export default function ChannelCard({ channelMetadata, onUpdate }: ChannelCardProps) {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<"menu" | "edit" | "shareChannel">("menu");
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // 4. Get Theme
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  const creator = channelMetadata.creator;

  useEffect(() => {
    const loadUserData = async () => {
      try {
        console.log("fetching user");
        const currentUsername = await AsyncStorage.getItem("currentUsername");
        if (currentUsername && currentUsername == creator) {
          setIsAdmin(true);
        }
      } catch (error) {
        console.log("Error fetching data :", error);
      }
    };

    loadUserData();
  }, []);

  console.log(isAdmin);

  const handlePress = () => {
    router.push({
      pathname: "/(tabs)/channelPage",
      params: {
        channel: JSON.stringify(channelMetadata),
        messages: JSON.stringify([]),
      },
    });
  };

  const handleLongPress = () => {
    if (isAdmin) {
      setModalMode("menu");
      setModalVisible(true);
    } else {
      Alert.alert("Authorization Error", "You are not an admin of this channel.", [
        { text: "OK", onPress: () => console.log("OK Pressed") },
      ]);
    }
  };

  const handleModifyPress = () => {
    setModalMode("edit");
  };

  const handleUpdateSubmit = async (data: { name: string; img: string; theme: any }) => {
    setLoading(true);
    try {
      const updateData: ChannelUpdateMetadata = {
        name: data.name,
        img: data.img,
        theme: data.theme,
      };

      await api.updateChannel(channelMetadata.id, updateData);

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
      await api.deleteChannel(channelMetadata.id);
      setModalVisible(false);
      onUpdate();
    } catch (error) {
      console.error("Delete failed", error);
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
            {modalMode === "menu" ? (
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
            ) : (
              <>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Channel</Text>
                <ChannelForm
                  initialData={{
                    name: channelMetadata.name,
                    img: channelMetadata.img,
                    theme: channelMetadata.theme,
                  }}
                  onSubmit={handleUpdateSubmit}
                  submitLabel="Save Changes"
                  onCancel={() => setModalMode("menu")}
                  loading={loading}
                />
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <Pressable
        onPress={handlePress}
        onLongPress={handleLongPress}
        style={({ pressed }) => [
          styles.cardContainer,
          // 7. Apply Theme to Card Background and Pressed State
          {
            backgroundColor: theme.cardBg,
            borderColor: theme.inputBorder, // Subtle border in dark mode
          },
          pressed && { opacity: 0.7, backgroundColor: theme.inputBg }, // Replaces styles.cardPressed
        ]}
      >
        <Image source={{ uri: channelMetadata.img }} style={styles.cardImage} resizeMode="cover" />
        <View style={styles.textContainer}>
          <Text style={[styles.channelName, { color: theme.text }]} numberOfLines={1}>
            {channelMetadata.name}
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
  cardWrapper: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  cardContainer: {
    flexDirection: "row",
    alignItems: "center",
    // backgroundColor: "#FFFFFF", // Removed, handled inline
    borderRadius: 16,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    // borderColor: "#F0F0F0", // Removed, handled inline
  },
  // cardPressed removed, handled inline for dynamic colors
  cardImage: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: "#E1E4E8",
  },
  textContainer: {
    flex: 1,
    marginLeft: 15,
    justifyContent: "center",
  },
  channelName: {
    fontSize: 16,
    fontWeight: "700",
    // color: "#1A4D8C", // Removed, handled inline
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 13,
    // color: "#8E8E93", // Removed, handled inline
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "85%",
    // backgroundColor: "white", // Removed, handled inline
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    // color: "#1A4D8C", // Removed, handled inline
  },
  modalSubtitle: {
    fontSize: 16,
    marginBottom: 20,
    // color: "#666", // Removed, handled inline
  },
  modalButton: {
    width: "100%",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  modalButtonDisabled: {
    width: "100%",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
    backgroundColor: "grey",
    color: "gray",
  },
  buttonModify: {
    backgroundColor: "#E3F2FD", // Kept specific status colors
  },
  textModify: {
    color: "#1E88E5",
    fontWeight: "bold",
    fontSize: 16,
  },
  buttonDelete: {
    backgroundColor: "#FFEBEE", // Kept specific status colors
  },
  textDelete: {
    color: "#D32F2F",
    fontWeight: "bold",
    fontSize: 16,
  },
  buttonShare: {
    backgroundColor: "#8af7cd", // Kept specific status colors
  },
  textShare: {
    color: "#1c9c22",
    fontWeight: "bold",
    fontSize: 16,
  },
  buttonCancel: {
    marginTop: 5,
  },
  textCancel: {
    color: "#999",
    fontSize: 14,
  },
});
