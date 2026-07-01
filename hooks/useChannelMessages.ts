import { store } from "@/store"; // Import Redux store to get the token for WebSockets
import { ChannelMetadata, ModifiedMessageMetadata, UserMetadata } from "@/types/types";
import { API } from "@/utils/api";
import { formatImgUrl, isImgUrl } from "@/utils/utils";
import { useEffect, useState } from "react";
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

  useEffect(() => {
    if (!channel || !serverUrl) return;

    console.log("Refreshing channel " + channel.id + " on server " + serverUrl);
    console.log(`[DEBUG FRONTEND] Fetching messages from: ${serverUrl}/protected/channels/${channel.id}/messages`);

    setBatchOffset(0);
    setHasMore(false);
    setIsFetchingHistory(false);

    // 1. Initialize API for this specific server
    const apiClient = new API(serverUrl);

    apiClient.getMessages(channel.id, 0).then((initialMessages) => {
      // inverted because we want newest message at the start of the array
      initialMessages.forEach((message) => console.log(message.type, " - ", message.content));
      setMessages(initialMessages.reverse());
    });

    const usernamesToFetch = channel.members.map((m) => m.user.username);
    apiClient.getUserData(usernamesToFetch).then((result) => setMembers(result));

    // --- SOCKET.IO IMPLEMENTATION ---

    // 2. Fetch the correct token for this server from Redux
    const state = store.getState();
    const token = state.servers?.accounts?.[serverUrl]?.accessToken;

    // 3. Connect to the dynamic serverUrl, NOT the hardcoded IP
    console.log(`[DEBUG FRONTEND] Connecting Socket.IO to: ${serverUrl}`);
    const socket = io(serverUrl, {
      auth: {
        token: token,
      },
      forceNew: true,
      multiplex: false,
    });

    socket.on("connect", () => {
      console.log("Connected to Socket.IO on " + serverUrl);
      socket.emit("joinChannel", channel.id);
    });

    socket.on("message", (newMessage) => {
      setMessages((prev) => {
        if (prev.some((msg) => msg.id === newMessage.id)) {
          return prev;
        }
        return [newMessage, ...prev];
      });
    });

    return () => {
      console.log("Closing socket for channel " + channel.id);
      socket.emit("leaveChannel", channel.id);
      socket.disconnect();
    };
  }, [channel?.id, serverUrl]);

  const loadOlderMessages = async () => {
    if (isFetchingHistory || !hasMore || !serverUrl) return;

    setIsFetchingHistory(true);

    try {
      console.log(
        `[DEBUG FRONTEND] Fetching older messages from: ${serverUrl}/protected/channels/${channel.id}/messages`,
      );
      const apiClient = new API(serverUrl);
      const nextBatch = batchOffset + 40;

      const olderMessages = await apiClient.getMessages(channel.id, nextBatch);

      if (olderMessages.length < 40) {
        setHasMore(false);
      }
      if (olderMessages.length > 0) {
        setMessages((prev) => {
          const uniqueOlderMessages = olderMessages.filter((msg) => !prev.some((pMsg) => pMsg.id === msg.id));
          return [...prev, ...uniqueOlderMessages];
        });
        setBatchOffset(nextBatch);
      }
    } catch (error) {
      console.error("Failed to load history:", error);
    } finally {
      setIsFetchingHistory(false);
    }
  };

  const sendMessage = async (content: string, imageFile?: File | Blob | string | undefined) => {
    if (!channel || (!content.trim() && !imageFile) || !serverUrl) return;

    try {
      console.log(`[DEBUG FRONTEND] Sending message to: ${serverUrl}/protected/channels/${channel.id}/messages`);
      const apiClient = new API(serverUrl);
      let messageContent = content;
      let messageType: "Text" | "Image" = "Text";

      if (imageFile) {
        // if there is an image to upload, upload it then send the url of the uploaded image as message
        console.log("There is an image file");
        const uploadedImageUrl = await apiClient.uploadImage(imageFile);
        messageContent = formatImgUrl(uploadedImageUrl.url);
        messageType = "Image";
      } else if (isImgUrl(content)) {
        messageContent = formatImgUrl(content);
        messageType = "Image";
      }

      console.log(messageType, " - ", messageContent);
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
