import { ChannelMetadata } from "@/types/types";
import { optimizeThemeForReadability } from "@/utils/utils";
import React from "react";
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type ChannelHeaderProps = {
  channel: ChannelMetadata;

  isAdmin: boolean;
  handleShowQrCode: () => Promise<void>;
  handleShareInvite: () => Promise<void>;
  isSharing: boolean;
};

export default function ChannelHeader({
  channel,
  isAdmin,
  handleShowQrCode,
  handleShareInvite,
  isSharing,
}: ChannelHeaderProps) {
  const theme = channel?.theme
    ? optimizeThemeForReadability(channel.theme)
    : {
        primary_color: "#E91E63",
        primary_color_dark: "#C2185B",
        accent_color: "#00BCD4",
        text_color: "#212121",
        accent_text_color: "#FFFFFF",
      };

  return (
    <View
      style={[
        styles.header,
        {
          borderBottomColor: theme.primary_color,
          backgroundColor: theme.primary_color_dark,
        },
      ]}
    >
      {/* <TouchableOpacity onPress={() => router.dismissTo("/(tabs)/channelSelectionPage")} style={{ paddingRight: 12, paddingLeft: 4 }}>
              <FontAwesome name="arrow-left" size={20} color={theme.text_color} />
            </TouchableOpacity> */}

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
  headerAddButton: {
    marginLeft: "auto",
    padding: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ccc",
  },
});
