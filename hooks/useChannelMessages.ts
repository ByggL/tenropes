import {
  ChannelMetadata,
  ModifiedMessageMetadata,
  UserMetadata,
} from "@/types/types";
import api from "@/utils/api";
import { formatImgUrl, isImgUrl } from "@/utils/utils";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { io } from "socket.io-client"; // <-- Import Socket.IO client

export function useChannelMessages(
  channel: ChannelMetadata,
  setMembers: React.Dispatch<React.SetStateAction<UserMetadata[]>>,
) {
  const [messages, setMessages] = useState<ModifiedMessageMetadata[]>([]);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  const [batchOffset, setBatchOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!channel) return;

      console.log("Refreshing channel " + channel.id);

      setBatchOffset(0);
      setHasMore(false);
      setIsFetchingHistory(false);

      api.getMessages(channel.id, 0).then((initialMessages) => {
        // inverted because we want newest message at the start of the array
        setMessages(initialMessages.reverse());
      });

      const usernamesToFetch = channel.members.map((m) => m.user.username);
      api.getUserData(usernamesToFetch).then((result) => setMembers(result));
      // --- SOCKET.IO IMPLEMENTATION ---

      const socket = io("http://192.168.1.155:3000", {
        auth: {
          token: api.jwtToken,
        },
      });

      socket.on("connect", () => {
        console.log("Connected to Socket.IO!");
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
    }, [channel?.id]),
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

  const sendMessage = async (content: string) => {
    if (!channel || !content.trim()) return;

    const isImageLink = isImgUrl(content);

    try {
      await api.sendMessage(channel.id, {
        type: isImageLink ? "Image" : "Text",
        content: isImageLink ? formatImgUrl(content) : content,
      });
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
