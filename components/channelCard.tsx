import { ChannelMetadata } from "@/types/types";
import { FontAwesome } from "@expo/vector-icons"; // For the chevron icon
import { useRouter } from "expo-router";
import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

// Define props clearly
interface ChannelCardProps {
  channelMetadata: ChannelMetadata;
}

export default function ChannelCard({ channelMetadata }: ChannelCardProps) {
  const router = useRouter();

  const handlePress = () => {
    console.log("Access to channel:", channelMetadata.name);

    router.push({
      pathname: "/(tabs)/channelPage",
      params: {
        channel: JSON.stringify(channelMetadata),
        // Pass empty messages initially, let the page fetch them
        messages: JSON.stringify([]),
      },
    });
  };

  return (
    <View style={styles.cardWrapper}>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.cardContainer,
          pressed && styles.cardPressed, // Visual feedback on press
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

        {/* Chevron Icon for better UX */}
        <FontAwesome name="chevron-right" size={14} color="#C7C7CC" />
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
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    // Subtle Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3, // Android shadow
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
    borderRadius: 14, // Slightly squared circle (modern look)
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
    color: "#1A4D8C", // TenRopes Dark Blue
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 13,
    color: "#8E8E93",
  },
});
