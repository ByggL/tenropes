import { ChannelMetadata, ChannelUpdateMetadata } from "@/types/types";
import api from "@/utils/api";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import ChannelForm from "./channelCreaModifForm"; // Import the form

interface ChannelCardProps {
  channelMetadata: ChannelMetadata;
  onUpdate: () => void;
}

export default function ChannelCard({
  channelMetadata,
  onUpdate,
}: ChannelCardProps) {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  // 'menu' shows options, 'edit' shows the form
  const [modalMode, setModalMode] = useState<"menu" | "edit">("menu");
  const [loading, setLoading] = useState(false);

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
    setModalMode("menu"); // Reset to menu when opening
    setModalVisible(true);
  };

  // Switch to Edit Mode inside the Modal
  const handleModifyPress = () => {
    setModalMode("edit");
  };

  // Handle the Form Submission
  const handleUpdateSubmit = async (data: { name: string; img: string }) => {
    setLoading(true);
    try {
      // We must preserve the existing theme as the API requires it
      const updateData: ChannelUpdateMetadata = {
        name: data.name,
        img: data.img,
        theme: channelMetadata.theme, //
      };

      await api.updateChannel(channelMetadata.id, updateData); //

      setModalVisible(false);
      onUpdate(); // Refresh the list
      Alert.alert("Success", "Channel updated.");
    } catch (error) {
      console.error("Update failed", error);
      Alert.alert("Error", "Failed to update channel.");
    } finally {
      setLoading(false);
    }
  };

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
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          {/* Prevent clicks inside content from closing modal */}
          <Pressable style={styles.modalContent} onPress={() => {}}>
            {/* --- MENU MODE --- */}
            {modalMode === "menu" ? (
              <>
                <Text style={styles.modalTitle}>Channel Options</Text>
                <Text style={styles.modalSubtitle}>
                  What do you want to do?
                </Text>

                <Pressable
                  style={[styles.modalButton, styles.buttonModify]}
                  onPress={handleModifyPress}
                >
                  <Text style={styles.textModify}>Modify Channel</Text>
                </Pressable>

                <Pressable
                  style={[styles.modalButton, styles.buttonDelete]}
                  onPress={handleDelete}
                >
                  <Text style={styles.textDelete}>Delete Channel</Text>
                </Pressable>

                <Pressable
                  style={[styles.modalButton, styles.buttonCancel]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.textCancel}>Cancel</Text>
                </Pressable>
              </>
            ) : (
              /* --- EDIT MODE --- */
              <>
                <Text style={styles.modalTitle}>Edit Channel</Text>
                <ChannelForm
                  initialData={{
                    name: channelMetadata.name,
                    img: channelMetadata.img,
                    theme: channelMetadata.theme,
                  }}
                  onSubmit={handleUpdateSubmit}
                  submitLabel="Save Changes"
                  onCancel={() => setModalMode("menu")} // Go back to menu
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
          pressed && styles.cardPressed,
        ]}
      >
        <Image
          source={{ uri: channelMetadata.img }}
          style={styles.cardImage}
          resizeMode="cover"
        />
        <View style={styles.textContainer}>
          <Text style={styles.channelName} numberOfLines={1}>
            {channelMetadata.name}
          </Text>
          <Text style={styles.lastMessage} numberOfLines={1}>
            Tap to view messages
          </Text>
        </View>
        <FontAwesome name="chevron-right" size={14} color="#C7C7CC" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  // ... (Keep your existing styles for cardWrapper, cardContainer, etc.)
  cardWrapper: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  cardContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  cardPressed: {
    backgroundColor: "#F5F5F5",
    transform: [{ scale: 0.98 }],
  },
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
    color: "#1A4D8C",
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 13,
    color: "#8E8E93",
  },

  // --- Modal Styles ---
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "white",
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
    color: "#1A4D8C",
  },
  modalSubtitle: {
    fontSize: 16,
    marginBottom: 20,
    color: "#666",
  },
  modalButton: {
    width: "100%",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonModify: {
    backgroundColor: "#E3F2FD",
  },
  textModify: {
    color: "#1E88E5",
    fontWeight: "bold",
    fontSize: 16,
  },
  buttonDelete: {
    backgroundColor: "#FFEBEE",
  },
  textDelete: {
    color: "#D32F2F",
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
