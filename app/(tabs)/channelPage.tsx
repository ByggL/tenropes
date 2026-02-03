import React, { useState } from "react";
import { ActivityIndicator, FlatList, StatusBar } from "react-native";

import ChannelHeader from "@/components/chat/ChannelHeader";
import MessageInput from "@/components/chat/MessageInput";
import MessageItem from "@/components/chat/MessageItem";
import QrCodeModal from "@/components/chat/QrCodeModal";
import { useChannelAdmin } from "@/hooks/useChannelAdmin";
import { useChannelMessages } from "@/hooks/useChannelMessages";
import { ChannelMetadata, UserMetadata } from "@/types/types";
import { optimizeThemeForReadability } from "@/utils/utils";
import { useLocalSearchParams, useRouter } from "expo-router"; // 1. Import useFocusEffect
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChatChannel() {
  const router = useRouter();
  const channelParam = useLocalSearchParams().channel;
  const channel: ChannelMetadata = channelParam ? JSON.parse(channelParam as string) : null;

  const [members, setMembers] = useState<UserMetadata[]>([]);
  const [inputText, setInputText] = useState("");

  // all the admin related logic is encapsulated in this hook
  const {
    isAdmin,
    isSharing,
    isQrModalVisible,
    setQrModalVisible,
    qrInviteLink,
    isLoadingQr,
    handleShowQrCode,
    handleShareInvite,
  } = useChannelAdmin(channel);

  // all the message related logic is encapsulated in this hook
  const { messages, isFetchingHistory, loadOlderMessages, sendMessage } = useChannelMessages(channel, setMembers);

  const theme = channel?.theme
    ? optimizeThemeForReadability(channel.theme)
    : {
        primary_color: "#E91E63",
        primary_color_dark: "#C2185B",
        accent_color: "#00BCD4",
        text_color: "#212121",
        accent_text_color: "#FFFFFF",
      };

  const onSendPress = async () => {
    await sendMessage(inputText);
    setInputText("");
  };

  return (
    <SafeAreaView style={{ backgroundColor: theme.primary_color_dark, flex: 1 }}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary_color_dark} />

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
        onEndReachedThreshold={0.2} // triggers when user is 20% away from top
        ListFooterComponent={
          isFetchingHistory ? <ActivityIndicator size="small" color="#999" style={{ marginVertical: 20 }} /> : null
        }
        renderItem={({ item, index }) => (
          <MessageItem item={item} index={index} channel={channel} messages={messages} members={members} />
        )}
        contentContainerStyle={{ paddingVertical: 10 }}
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
