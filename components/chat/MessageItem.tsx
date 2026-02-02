import { ChannelMetadata, MessageMetadata, UserMetadata } from "@/types/types";
import { formatTime, getUserFromName, optimizeThemeForReadability } from "@/utils/utils";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import ImageAttachment from "./ImageAttachment";

type MessageInputProps = {
  item: MessageMetadata;
  index: number;
  channel: ChannelMetadata;
  messages: MessageMetadata[];
  members: UserMetadata[];
};

export default function MessageInput({ item, index, channel, messages, members }: MessageInputProps) {
  const theme = channel?.theme
    ? optimizeThemeForReadability(channel.theme)
    : {
        primary_color: "#E91E63",
        primary_color_dark: "#C2185B",
        accent_color: "#00BCD4",
        text_color: "#212121",
        accent_text_color: "#FFFFFF",
      };

  const olderMessage = messages[index + 1];
  const isSameAuthor = olderMessage && olderMessage.author === item.author;

  // Use a default avatar if none exists
  const avatarUrl = `https://pixelcorner.fr/cdn/shop/articles/le-nyan-cat-618805.webp?v=1710261022&width=2048`;
  const author = getUserFromName(members, item.author);
  const senderAvatar = () => {
    return author?.img || avatarUrl;
  };

  return (
    <View style={[styles.messageContainer, isSameAuthor ? styles.messageContainerCompact : null]}>
      {!isSameAuthor ? <Image source={{ uri: senderAvatar() }} style={styles.avatar} /> : <View style={styles.avatarPlaceholder} />}

      <View style={styles.messageContent}>
        {!isSameAuthor && (
          <View style={styles.headerContent}>
            <Text style={[styles.authorName, { color: theme.text_color }]}>{item.author}</Text>
            <Text style={styles.timestamp}>{formatTime(item.timestamp)}</Text>
          </View>
        )}

        {item.content.type == "Text" ? (
          <Text style={[styles.messageText, { color: theme.accent_text_color }]}>{item.content.value}</Text>
        ) : (
          // <Image source={{ uri: item.content.value }} style={styles.imageAttachment} resizeMode="cover" />
          <ImageAttachment uri={item.content.value} baseStyle={styles.imageAttachment} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  messageContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 16,
  },
  messageContainerCompact: {
    marginTop: 2,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ccc",
  },
  avatarPlaceholder: {
    width: 40,
  },
  messageContent: {
    marginLeft: 12,
    flex: 1,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 4,
  },
  authorName: {
    fontWeight: "bold",
    fontSize: 16,
    marginRight: 8,
  },
  timestamp: {
    color: "#72767d",
    fontSize: 12,
  },
  imageAttachment: {
    // width: 280,
    // height: 180,
    borderRadius: 8,
    marginTop: 6,
    backgroundColor: "#202225",
    overflow: "hidden",
    maxWidth: "100%",
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
});
