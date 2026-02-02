import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import ImageAttachment from "@/components/ImageAttachment";
import { ChannelMetadata, MessageMetadata, UserMetadata } from "@/types/types";
import api from "@/utils/api";
import { isImgUrl } from "@/utils/utils";
import { useFocusEffect, useLocalSearchParams } from "expo-router"; // 1. Import useFocusEffect

interface ChatChannelProps {
  channel: ChannelMetadata;
  messages: MessageMetadata[];
}

export default function ChatChannel() {
  const channelParam = useLocalSearchParams().channel;
  const channel: ChannelMetadata = channelParam ? JSON.parse(channelParam as string) : null;

  const [members, setMembers] = useState<UserMetadata[]>([]);
  const [inputText, setInputText] = useState("");
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<MessageMetadata[]>([]);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  const [batchOffset, setBatchOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // 2. Use useFocusEffect instead of useEffect
  useFocusEffect(
    useCallback(() => {
      if (!channel) return;

      console.log("Refreshing channel " + channel.id);

      setBatchOffset(0);
      setHasMore(true);
      setIsFetchingHistory(false);

      api.getMessages(channel.id, 0).then((initialMessages) => {
        // inverted because we want newest message at the start of the array
        setMessages(initialMessages.reverse());
      });

      api.getUserData(channel.users).then((result) => setMembers(result));

      // B. Setup WebSocket
      const socket = new WebSocket(`https://edu.tardigrade.land/msg/ws/channel/${channel.id}/token/${api.jwtToken}`);

      socket.onopen = () => {
        console.log("Connected!");
      };

      socket.onmessage = (event) => {
        const newMessage = JSON.parse(event.data);

        setMessages((prev) => [newMessage, ...prev]);
      };

      // C. Cleanup function (runs when you leave the screen or blur)
      return () => {
        console.log("Closing socket for channel " + channel.id);
        socket.close();
      };
    }, [channel?.id]), // Re-run if channel ID changes
  );

  const loadOlderMessages = async () => {
    if (isFetchingHistory || !hasMore) return;

    setIsFetchingHistory(true);

    try {
      const nextBatch = batchOffset + 40;

      const olderMessages = await api.getMessages(channel.id, nextBatch);

      if (olderMessages.length === 0) {
        setHasMore(false);
      } else {
        // since API returns [oldest ... newer], we need them reversed [newer ... oldest] to append to the list
        const reversedHistory = olderMessages.reverse();

        setMessages((prev) => [...prev, ...reversedHistory]);

        setBatchOffset(nextBatch);
      }
    } catch (error) {
      console.error("Failed to load history:", error);
    } finally {
      setIsFetchingHistory(false);
    }
  };

  const theme = channel?.theme
    ? channel.theme
    : {
        primary_color: "#E91E63",
        primary_color_dark: "#C2185B",
        accent_color: "#00BCD4",
        text_color: "#212121",
        accent_text_color: "#FFFFFF",
      };

  const handleSend = () => {
    const content = inputText.trim();
    if (content.length === 0) return;

    const isImageLink = isImgUrl(content);

    console.log(isImageLink);

    api.sendMessage(channel.id, {
      type: isImageLink ? "Image" : "Text",
      value: content,
    });

    setInputText("");
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getUserFromName = (username: string) => {
    return members.find((member) => member.username == username);
  };

  const renderMessage = ({ item, index }: { item: MessageMetadata; index: number }) => {
    const olderMessage = messages[index + 1];
    const isSameAuthor = olderMessage && olderMessage.author === item.author;

    const avatarUrl = `https://pixelcorner.fr/cdn/shop/articles/le-nyan-cat-618805.webp?v=1710261022&width=2048`;

    const author = getUserFromName(item.author);

    const senderAvatar = () => {
      return author?.img || avatarUrl;
    };

    return (
      <View style={[styles.messageContainer, isSameAuthor ? styles.messageContainerCompact : null]}>
        {!isSameAuthor ? (
          <Image source={{ uri: senderAvatar() }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder} />
        )}

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
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.primary_color_dark }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary_color_dark} />

      <View
        style={[
          styles.header,
          {
            borderBottomColor: theme.primary_color,
            backgroundColor: theme.primary_color_dark,
          },
        ]}
      >
        <Image source={{ uri: channel.img }} style={styles.avatar} />
        <Text style={[styles.channelName, { color: theme.text_color, paddingLeft: 8 }]}>{channel?.name}</Text>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item, index) => index.toString()}
        inverted={true}
        onEndReached={loadOlderMessages}
        onEndReachedThreshold={0.2} // triggers when user is 20% away from top
        ListFooterComponent={
          isFetchingHistory ? <ActivityIndicator size="small" color="#999" style={{ marginVertical: 20 }} /> : null
        }
        renderItem={renderMessage}
        contentContainerStyle={{ paddingVertical: 10 }}
      />

      {/* <FlatList
        ref={flatListRef}
        data={messages}
        // Force re-render when messages change
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderMessage}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => {
          if (messages.length > 0) {
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }
        }}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        removeClippedSubviews={true}
      /> */}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
      >
        <View style={[styles.inputContainer, { backgroundColor: theme.primary_color }]}>
          <TouchableOpacity style={styles.attachButton}>
            <Text style={{ color: theme.accent_color, fontSize: 20 }}>+</Text>
          </TouchableOpacity>

          <TextInput
            style={[
              styles.input,
              {
                color: theme.text_color,
                backgroundColor: theme.primary_color_dark,
              },
            ]}
            placeholder={`Envoyer un message dans #${channel?.name}`}
            placeholderTextColor="#72767d"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSend}
          />

          <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
            <Text style={{ color: theme.accent_color, fontWeight: "bold" }}>→</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    elevation: 2,
  },
  channelHash: {
    fontSize: 24,
    marginRight: 8,
    fontWeight: "300",
  },
  channelName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  listContent: {
    paddingVertical: 16,
    flexGrow: 1,
    justifyContent: "flex-end",
  },
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
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    margin: 16,
    borderRadius: 8,
  },
  attachButton: {
    width: 30,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 16,
  },
  sendButton: {
    marginLeft: 10,
    padding: 8,
  },
});
