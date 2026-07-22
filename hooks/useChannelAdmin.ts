import { store } from "@/store";
import { ChannelMetadata } from "@/types/types";
import { API } from "@/utils/api";
import { useCallback, useEffect, useState } from "react";
import { Alert, Share } from "react-native";

export function useChannelAdmin(channel: ChannelMetadata | null, serverUrl: string) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isQrModalVisible, setQrModalVisible] = useState(false);
  const [qrInviteLink, setQrInviteLink] = useState("");
  const [isLoadingQr, setIsLoadingQr] = useState(false);

  // check admin status
  useEffect(() => {
    if (!channel || !serverUrl) return;

    const checkAdmin = async () => {
      try {
        const state = store.getState();
        const currentUsername = state.servers?.accounts?.[serverUrl]?.username;

        if (!currentUsername || !channel) {
          setIsAdmin(false);
          return;
        }

        const memberRole = channel.members?.find((m) => m.user?.username === currentUsername)?.role;

        const isUserAdmin =
          memberRole === "admin" ||
          memberRole === "creator" ||
          (channel as any).creator === currentUsername ||
          (channel as any).creator?.username === currentUsername;

        setIsAdmin(Boolean(isUserAdmin));
      } catch (error) {
        console.error("error checking admin status:", error);
      }
    };

    checkAdmin();
  }, [channel, serverUrl]);

  const handleShowQrCode = useCallback(async () => {
    if (!channel || !serverUrl) return;
    setQrModalVisible(true);

    if (qrInviteLink) return;

    setIsLoadingQr(true);
    try {
      const apiClient = new API(serverUrl);
      const link = await apiClient.createInvite(channel.id);
      console.log("Generated QR invite link:", link);
      setQrInviteLink(link);
      setQrModalVisible(true);
    } catch (error) {
      console.error("Error generating QR code:", error);
      Alert.alert("Error", "Could not generate QR code.");
      setQrModalVisible(false);
    } finally {
      setIsLoadingQr(false);
    }
  }, [channel?.id, serverUrl, qrInviteLink]);

  const handleShareInvite = useCallback(async () => {
    if (!channel || isSharing || !serverUrl) return;
    setIsSharing(true);

    try {
      const apiClient = new API(serverUrl);
      const link = await apiClient.createInvite(channel.id);
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
  }, [channel?.id, channel?.name, isSharing, serverUrl]);

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
