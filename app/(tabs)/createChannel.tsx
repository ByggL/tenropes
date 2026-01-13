import ChannelForm from "@/components/channelCreaModifForm";
import { Text } from "@/components/Themed"; // Use Themed components
import Colors from "@/constants/Colors"; // Import Colors
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  useColorScheme, // Import hook
} from "react-native";
import { NewChannelData, Theme } from "../../types/types";
import api from "../../utils/api";

export default function CreateChannelPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  const handleCreate = async (data: {
    name: string;
    img: string;
    theme: Theme;
  }) => {
    // ... (Keep your existing logic exactly as is) ...
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
      await api.createNewChannel(newChannelData);

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
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text
          style={[
            styles.title,
            { color: colorScheme === "dark" ? theme.text : "#1A4D8C" },
          ]}
        >
          Create New Channel
        </Text>
        <Text style={[styles.subtitle, { color: theme.subText }]}>
          Start a new conversation topic.
        </Text>

        {/* Pass the theme to the form so it can style its inputs */}
        <ChannelForm
          onSubmit={handleCreate}
          submitLabel="Create Channel"
          loading={loading}
          // You might need to add a prop to ChannelForm to pass the current app theme
          // or handle it inside ChannelForm using the hook as well.
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor handled inline
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
    // color handled inline
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 32,
    // color handled inline
  },
});
