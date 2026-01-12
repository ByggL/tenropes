import ChannelForm from "@/components/channelCreaModifForm"; // Ensure path is correct
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
} from "react-native";
import { NewChannelData, Theme } from "../../types/types";
import api from "../../utils/api";

export default function CreateChannelPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleCreate = async (data: {
    name: string;
    img: string;
    theme: Theme;
  }) => {
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
      console.log(data.theme);
      await api.createNewChannel(newChannelData); //

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
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Create New Channel</Text>
        <Text style={styles.subtitle}>Start a new conversation topic.</Text>

        <ChannelForm
          onSubmit={handleCreate}
          submitLabel="Create Channel"
          loading={loading}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1A4D8C",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#718096",
    textAlign: "center",
    marginBottom: 32,
  },
});
