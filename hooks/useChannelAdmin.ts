import { ChannelMetadata } from "@/types/types";
import api from "@/utils/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import { Alert, Share } from "react-native";

export function useChannelAdmin(channel: ChannelMetadata | null) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isQrModalVisible, setQrModalVisible] = useState(false);
  const [qrInviteLink, setQrInviteLink] = useState("");
  const [isLoadingQr, setIsLoadingQr] = useState(false);

  // check admin status
  useEffect(() => {
    if (!channel) return;

    const checkAdmin = async () => {
      try {
        const currentUsername = await AsyncStorage.getItem("currentUsername");
        if (currentUsername && currentUsername === channel.creator) {
          setIsAdmin(true);
        }
      } catch (error) {
        console.error("error checking admin status:", error);
      }
    };

    checkAdmin();
  }, [channel?.creator]);

  const handleShowQrCode = useCallback(async () => {
    if (!channel) return;
    setQrModalVisible(true);
    console.log("isQrModalVisible:", isQrModalVisible);

    if (qrInviteLink) return;

    setIsLoadingQr(true);
    try {
      const link = await api.createInvite(channel.id);
      console.log("Generated QR invite link:", link);
      setQrInviteLink(link);
      setQrModalVisible(true);
      console.log("isQrModalVisible:", isQrModalVisible);
    } catch (error) {
      console.error("Error generating QR code:", error);
      Alert.alert("Error", "Could not generate QR code.");
      setQrModalVisible(false);
    } finally {
      setIsLoadingQr(false);
    }

    console.log("isQrModalVisible:", isQrModalVisible);
  }, [channel?.id]);

  const handleShareInvite = useCallback(async () => {
    if (!channel || isSharing) return;
    setIsSharing(true);

    try {
      const link = await api.createInvite(channel.id);
      const result = await Share.share({
        message: `Join me in #${channel.name} on Tenropes! Here is your invite link: ${link}`,
        url: link,
        title: `Invite to ${channel.name}`,
      });
    } catch (error) {
      Alert.alert("Error", "Could not share invite link.");
    } finally {
      setIsSharing(false);
    }
  }, [channel?.id, channel?.name, isSharing]);

  return {
    isAdmin,
    setIsAdmin,
    isSharing,
    setIsSharing,
    isQrModalVisible,
    setQrModalVisible,
    qrInviteLink,
    isLoadingQr,
    handleShowQrCode,
    handleShareInvite,
  };
}
