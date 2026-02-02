import { ChannelMetadata } from "@/types/types";
import { optimizeThemeForReadability } from "@/utils/utils";
import React from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type MessageInputProps = {
  channel: ChannelMetadata;
  inputText: string;
  setInputText: React.Dispatch<React.SetStateAction<string>>;
  handleSend: () => void;
};

export default function MessageInput({ channel, inputText, setInputText, handleSend }: MessageInputProps) {
  const insets = useSafeAreaInsets();

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
  );
}

const styles = StyleSheet.create({
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
});
