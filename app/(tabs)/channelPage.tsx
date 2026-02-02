import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";

import ImageAttachment from "@/components/ImageAttachment";
import { ChannelMetadata, MessageMetadata, UserMetadata } from "@/types/types";
import api from "@/utils/api";
import { formatImgUrl, isImgUrl, optimizeThemeForReadability } from "@/utils/utils";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router"; // 1. Import useFocusEffect
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

interface ChatChannelProps {
  channel: ChannelMetadata;
  messages: MessageMetadata[];
}

export default function ChatChannel() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const channelParam = useLocalSearchParams().channel;
  const channel: ChannelMetadata = channelParam ? JSON.parse(channelParam as string) : null;

  const [members, setMembers] = useState<UserMetadata[]>([]);
  const [inputText, setInputText] = useState("");
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<MessageMetadata[]>([]);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  const [batchOffset, setBatchOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [isSharing, setIsSharing] = useState(false);

  const [isQrModalVisible, setQrModalVisible] = useState(false);
  const [qrInviteLink, setQrInviteLink] = useState("");
  const [isLoadingQr, setIsLoadingQr] = useState(false);

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

      const socket = new WebSocket(`https://edu.tardigrade.land/msg/ws/channel/${channel.id}/token/${api.jwtToken}`);

      socket.onopen = () => {
        console.log("Connected!");
      };

      socket.onmessage = (event) => {
        const newMessage = JSON.parse(event.data);

        setMessages((prev) => [newMessage, ...prev]);
      };

      return () => {
        console.log("Closing socket for channel " + channel.id);
        socket.close();
      };
    }, [channel?.id]), // Re-run if channel ID changes
  );

  useEffect(() => {
    const loadUserData = async () => {
      try {
        console.log("fetching user");
        const currentUsername = await AsyncStorage.getItem("currentUsername");
        if (currentUsername && currentUsername == channel.creator) {
          setIsAdmin(true);
        }
      } catch (error) {
        console.log("Error fetching data :", error);
      }
    };

    loadUserData();
  }, []);

  const handleShareInvite = async () => {
    if (isSharing) return;
    setIsSharing(true);

    try {
      const link = await api.createInvite(channel.id);

      const result = await Share.share({
        message: `Join me in #${channel.name} on Tenropes! Here is your invite link: ${link}`,
        url: link,
        title: `Invite to ${channel.name}`,
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log("Shared via", result.activityType);
        } else {
          console.log("Shared successfully");
        }
      } else if (result.action === Share.dismissedAction) {
        console.log("Share dismissed");
      }
    } catch (error) {
      Alert.alert("Error", "Could not share invite link.");
      console.error(error);
    } finally {
      setIsSharing(false);
    }
  };

  const handleShowQrCode = async () => {
    setQrModalVisible(true);

    // Only fetch if we haven't fetched it yet (or fetch every time if links expire)
    if (qrInviteLink) return;

    setIsLoadingQr(true);
    try {
      const link = await api.createInvite(channel.id);
      setQrInviteLink(link);
    } catch (error) {
      Alert.alert("Error", "Could not generate QR code.");
      console.error(error);
      setQrModalVisible(false);
    } finally {
      setIsLoadingQr(false);
    }
  };

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
    ? optimizeThemeForReadability(channel.theme)
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
      value: isImageLink ? formatImgUrl(content) : content,
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

    // Use a default avatar if none exists
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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.primary_color_dark }]}>
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

        {isAdmin ? (
          <>
            <TouchableOpacity
              onPress={handleShowQrCode}
              style={[styles.headerAddButton, { marginRight: 8 }]} // Add margin to separate from the + button
            >
              <Text style={{ color: theme.accent_color, fontSize: 24, fontWeight: "bold" }}>▣</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShareInvite} style={styles.headerAddButton} disabled={isSharing}>
              {isSharing ? (
                <ActivityIndicator size="small" color={theme.accent_color} />
              ) : (
                <Text style={{ color: theme.accent_color, fontSize: 24, fontWeight: "bold" }}>+</Text>
              )}
            </TouchableOpacity>
          </>
        ) : null}
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

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 60}
        style={{ paddingTop: insets.top }}
      >
        <View style={[styles.inputContainer, { backgroundColor: theme.primary_color }]}>
          <TouchableOpacity style={styles.attachButton}>
            <Text style={{ color: theme.accent_color, fontSize: 20 }}>+</Text>
          </TouchableOpacity>

          <TextInput
            style={[
              styles.input,
              {
                color: theme.accent_text_color,
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

      <Modal
        animationType="slide"
        transparent={true}
        visible={isQrModalVisible}
        onRequestClose={() => setQrModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.primary_color_dark }]}>
            <Text style={[styles.modalTitle, { color: theme.text_color }]}>Scan to Join</Text>

            <View style={styles.qrContainer}>
              {isLoadingQr ? (
                <ActivityIndicator size="large" color={theme.accent_color} />
              ) : (
                <View style={styles.qrBackground}>
                  {/* We wrap QRCode in a white view because dark QRs on dark backgrounds rarely scan well */}
                  <QRCode value={qrInviteLink || "Loading..."} size={200} color="black" backgroundColor="white" />
                </View>
              )}
            </View>

            <Text style={[styles.modalLabel, { color: theme.accent_text_color, marginTop: 20 }]}>#{channel?.name}</Text>
            <Text style={[styles.modalLabel, { color: theme.accent_text_color, marginTop: 20 }]}>{qrInviteLink}</Text>

            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: theme.text_color, marginTop: 10 }]}
              onPress={() => setQrModalVisible(false)}
            >
              <Text style={{ color: theme.primary_color_dark, fontWeight: "bold" }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
  // 5. Added Back Button Style
  backButton: {
    marginRight: 15,
    padding: 4,
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
  headerAddButton: {
    marginLeft: "auto", // Pushes button to the right
    padding: 10,
  },
  qrContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
  },
  qrBackground: {
    padding: 16,
    backgroundColor: "white",
    borderRadius: 16,
    // Optional: Add shadow to make the QR pop
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)", // Slightly darker overlay
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#444",
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  modalLabel: {
    fontSize: 15,
    marginBottom: 12,
    textAlign: "center",
    lineHeight: 22,
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  linkContainer: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  linkText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  modalBtn: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
});
