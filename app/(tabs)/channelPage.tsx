// app/(tabs)/channelPage.tsx
import ChannelHeader from "@/components/chat/ChannelHeader";
import MessageInput from "@/components/chat/MessageInput";
import MessageItem from "@/components/chat/MessageItem";
import QrCodeModal from "@/components/chat/QrCodeModal";
import { useChannelAdmin } from "@/hooks/useChannelAdmin";
import { useChannelMessages } from "@/hooks/useChannelMessages";
import { ChannelMetadata, UserMetadata } from "@/types/types";
import { setActiveChannel } from "@/utils/notifications";
import { optimizeThemeForReadability } from "@/utils/utils";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, StatusBar, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChatChannel() {
  const params = useLocalSearchParams();
  const channelParam = params.channel;
  const serverUrl = params.serverUrl as string;

  // Parse the channel data passed from the selection page
  const channel: ChannelMetadata | null = channelParam ? JSON.parse(channelParam as string) : null;

  const [members, setMembers] = useState<UserMetadata[]>([]);
  const [inputText, setInputText] = useState("");

  // Call hooks (they must run every render)
  const {
    isAdmin,
    isSharing,
    isQrModalVisible,
    setQrModalVisible,
    qrInviteLink,
    isLoadingQr,
    handleShowQrCode,
    handleShareInvite,
  } = useChannelAdmin(channel, serverUrl);

  const { messages, isFetchingHistory, loadOlderMessages, sendMessage } = useChannelMessages(
    channel as ChannelMetadata,
    setMembers,
    serverUrl,
  );

  useFocusEffect(
    useCallback(() => {
      if (!channel) return;
      setActiveChannel(channel.id.toString());
      return () => setActiveChannel(null);
    }, [channel?.id, serverUrl]),
  );

  // CRASH GUARD: If no channel is selected yet, show a placeholder
  if (!channel) {
    return (
      <View style={styles.placeholder}>
        <ActivityIndicator size="large" color="#999" />
      </View>
    );
  }

  const theme = channel.theme
    ? optimizeThemeForReadability(channel.theme)
    : {
        primary_color_dark: "#222",
        primary_color: "#333",
      };

  const onSendPress = async (imageFile?: File | Blob | undefined) => {
    await sendMessage(inputText, imageFile);
    setInputText("");
  };

  return (
    <SafeAreaView style={{ backgroundColor: theme.primary_color_dark, flex: 1 }}>
      <StatusBar barStyle="light-content" />
      <ChannelHeader
        channel={channel}
        isAdmin={isAdmin}
        handleShowQrCode={handleShowQrCode}
        handleShareInvite={handleShareInvite}
        isSharing={isSharing}
      />
      <FlatList
        data={messages}
        keyExtractor={(item, index) => index.toString()}
        inverted={true}
        onEndReached={loadOlderMessages}
        renderItem={({ item, index }) => (
          <MessageItem item={item} index={index} channel={channel} messages={messages} members={members} />
        )}
      />
      <MessageInput channel={channel} inputText={inputText} setInputText={setInputText} handleSend={onSendPress} />
      <QrCodeModal
        channel={channel}
        isQrModalVisible={isQrModalVisible}
        setQrModalVisible={setQrModalVisible}
        isLoadingQr={isLoadingQr}
        qrInviteLink={qrInviteLink}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  placeholder: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" },
});
