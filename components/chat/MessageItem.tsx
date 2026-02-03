import { ChannelMetadata, MessageMetadata, UserMetadata } from "@/types/types";
import { formatTime, getUserFromName, isSameDay, optimizeThemeForReadability } from "@/utils/utils";
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

  const showDateSeparator = !olderMessage || !isSameDay(item.timestamp, olderMessage.timestamp);

  // Use a default avatar if none exists
  const avatarUrl = `https://pixelcorner.fr/cdn/shop/articles/le-nyan-cat-618805.webp?v=1710261022&width=2048`;
  const author = getUserFromName(members, item.author);
  const senderAvatar = () => {
    return author?.img || avatarUrl;
  };

  return (
    <View>
      {showDateSeparator && (
        <View style={styles.dateSeparator}>
          <Text style={[styles.dateSeparatorText, { color: theme.accent_text_color }]}>
            {new Date(item.timestamp).toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </Text>
        </View>
      )}

      <View style={[styles.messageContainer, isSameAuthor ? styles.messageContainerCompact : null]}>
        {!isSameAuthor || showDateSeparator ? (
          <Image source={{ uri: senderAvatar() }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder} />
        )}

        <View style={styles.messageContent}>
          {(!isSameAuthor || showDateSeparator) && (
            <View style={styles.headerContent}>
              <Text style={[styles.authorName, { color: theme.text_color }]}>
                {author?.display_name || author?.username || item.author}
              </Text>
              <Text style={[styles.timestamp, { color: theme.accent_text_color }]}>{formatTime(item.timestamp)}</Text>
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
    // color: "#494949",
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
  dateSeparator: {
    alignItems: "flex-start",
    marginVertical: 16,
    marginBottom: 8,
    marginLeft: 16,
  },
  dateSeparatorText: {
    fontSize: 12,
    fontWeight: "600",
    backgroundColor: "rgba(0,0,0,0.05)", // Optional: bubble effect
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: "hidden", // needed for borderRadius on Text on Android sometimes
  },
});
