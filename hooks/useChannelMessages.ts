import { store } from "@/store"; // Import Redux store to get the token for WebSockets
import { ChannelMetadata, ModifiedMessageMetadata, UserMetadata } from "@/types/types";
import { API } from "@/utils/api";
import { formatImgUrl, isImgUrl } from "@/utils/utils";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { io } from "socket.io-client";

export function useChannelMessages(
  channel: ChannelMetadata,
  setMembers: React.Dispatch<React.SetStateAction<UserMetadata[]>>,
  serverUrl: string, // <-- Now accepts serverUrl
) {
  const [messages, setMessages] = useState<ModifiedMessageMetadata[]>([]);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  const [batchOffset, setBatchOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!channel || !serverUrl) return;

      console.log("Refreshing channel " + channel.id + " on server " + serverUrl);

      setBatchOffset(0);
      setHasMore(false);
      setIsFetchingHistory(false);

      // 1. Initialize API for this specific server
      const apiClient = new API(serverUrl);

      apiClient.getMessages(channel.id, 0).then((initialMessages) => {
        // inverted because we want newest message at the start of the array
        setMessages(initialMessages.reverse());
      });

      const usernamesToFetch = channel.members.map((m) => m.user.username);
      apiClient.getUserData(usernamesToFetch).then((result) => setMembers(result));

      // --- SOCKET.IO IMPLEMENTATION ---

      // 2. Fetch the correct token for this server from Redux
      const state = store.getState();
      const token = state.servers?.accounts?.[serverUrl]?.accessToken;

      // 3. Connect to the dynamic serverUrl, NOT the hardcoded IP
      const socket = io(serverUrl, {
        auth: {
          token: token,
        },
      });

      socket.on("connect", () => {
        console.log("Connected to Socket.IO on " + serverUrl);
        socket.emit("joinChannel", channel.id);
      });

      socket.on("message", (newMessage) => {
        setMessages((prev) => [newMessage, ...prev]);
      });

      return () => {
        console.log("Closing socket for channel " + channel.id);
        socket.emit("leaveChannel", channel.id);
        socket.disconnect();
      };
    }, [channel?.id, serverUrl]),
  );

  const loadOlderMessages = async () => {
    if (isFetchingHistory || !hasMore || !serverUrl) return;

    setIsFetchingHistory(true);

    try {
      const apiClient = new API(serverUrl);
      const nextBatch = batchOffset + 40;

      const olderMessages = await apiClient.getMessages(channel.id, nextBatch);

      if (olderMessages.length === 0) {
        setHasMore(false);
      } else {
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

  const sendMessage = async (content: string, imageFile?: File | Blob) => {
    if (!channel || (!content.trim() && !imageFile) || !serverUrl) return;

    try {
      const apiClient = new API(serverUrl);
      let messageContent = content;
      let messageType: "Text" | "Image" = "Text";

      if (imageFile) {
        // if there is an image to upload, upload it then send the url of the uploaded image as message
        const uploadedImageUrl = await apiClient.uploadImage(imageFile);
        messageContent = formatImgUrl(uploadedImageUrl);
        messageType = "Image";
      } else if (isImgUrl(content)) {
        messageContent = formatImgUrl(content);
        messageType = "Image";
      }

      await apiClient.sendMessage(channel.id, {
        type: messageType,
        content: messageContent,
      });

      // if there both image and text, send text as a follow-up message
      if (imageFile && content.trim()) {
        await apiClient.sendMessage(channel.id, {
          type: "Text",
          content: content,
        });
      }
    } catch (error) {
      console.error("Failed to send message", error);
    }
  };

  return {
    messages,
    isFetchingHistory,
    loadOlderMessages,
    sendMessage,
  };
}
