import {
  ChannelMetadata,
  ModifiedMessageMetadata,
  UserMetadata,
} from "@/types/types";
import api from "@/utils/api";
import { formatImgUrl, isImgUrl } from "@/utils/utils";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

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
        console.log(initialMessages);
      });

      api.getUserData(channel.users).then((result) => setMembers(result));

      const socket = new WebSocket(
        `https://edu.tardigrade.land/msg/ws/channel/${channel.id}/token/${api.jwtToken}`,
      );

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
