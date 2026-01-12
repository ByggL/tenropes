import React, { useRef, useState } from "react";
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { ChannelMetadata, MessageMetadata } from "@/types/types";
import api from "@/utils/api";

// --- Props du Composant ---

interface ChatChannelProps {
  channel: ChannelMetadata;
  messages: MessageMetadata[];
}

// --- Composant Principal ---

const ChatChannel: React.FC<ChatChannelProps> = ({ channel, messages }) => {
  const [inputText, setInputText] = useState("");
  const flatListRef = useRef<FlatList>(null);
  const { theme } = channel;

  const handleSend = () => {
    if (inputText.trim().length === 0) return;
    api.sendMessage(channel.id, { type: "text", value: inputText.trim() });
    setInputText("");
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const renderMessage = ({
    item,
    index,
  }: {
    item: MessageMetadata;
    index: number;
  }) => {
    // Détection basique pour savoir si on groupe les messages du même auteur
    const isSameAuthor =
      index > 0 && messages[index - 1].author === item.author;

    // Placeholder pour l'avatar (en prod, utiliser l'image utilisateur réelle)
    const avatarUrl = `https://pixelcorner.fr/cdn/shop/articles/le-nyan-cat-618805.webp?v=1710261022&width=2048`;

    return (
      <View
        style={[
          styles.messageContainer,
          isSameAuthor ? styles.messageContainerCompact : null,
        ]}
      >
        {!isSameAuthor ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder} />
        )}

        <View style={styles.messageContent}>
          {!isSameAuthor && (
            <View style={styles.headerContent}>
              <Text style={[styles.authorName, { color: theme.text_color }]}>
                {item.author}
              </Text>
              <Text style={styles.timestamp}>{formatTime(item.timestamp)}</Text>
            </View>
          )}

          <Text
            style={[styles.messageText, { color: theme.accent_text_color }]}
          >
            {item.content.value}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.primary_color_dark }]}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.primary_color_dark}
      />

      {/* Header du Canal */}
      <View
        style={[
          styles.header,
          {
            borderBottomColor: theme.primary_color,
            backgroundColor: theme.primary_color_dark,
          },
        ]}
      >
        <Text style={[styles.channelHash, { color: theme.accent_color }]}>
          #
        </Text>
        <Text style={[styles.channelName, { color: theme.text_color }]}>
          {channel.name}
        </Text>
      </View>

      {/* Liste des Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderMessage}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Zone de Saisie */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
      >
        <View
          style={[
            styles.inputContainer,
            { backgroundColor: theme.primary_color },
          ]}
        >
          <TouchableOpacity style={styles.attachButton}>
            <Text style={{ color: theme.accent_color, fontSize: 20 }}>+</Text>
          </TouchableOpacity>

          <TextInput
            style={[
              styles.input,
              {
                color: theme.text_color,
                backgroundColor: theme.primary_color_dark,
              },
            ]}
            placeholder={`Envoyer un message dans #${channel.name}`}
            placeholderTextColor="#72767d"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSend}
          />

          <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
            {/* Icône d'envoi simplifiée */}
            <Text style={{ color: theme.accent_color, fontWeight: "bold" }}>
              →
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

// --- Styles ---

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
  channelHash: {
    fontSize: 24,
    marginRight: 8,
    fontWeight: "300",
  },
  channelName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  listContent: {
    paddingVertical: 16,
  },
  messageContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 16,
  },
  messageContainerCompact: {
    marginTop: 2, // Espacement réduit pour les messages successifs
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ccc",
  },
  avatarPlaceholder: {
    width: 40,
  },
  messageContent: {
    marginLeft: 12,
    flex: 1,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 4,
  },
  authorName: {
    fontWeight: "bold",
    fontSize: 16,
    marginRight: 8,
  },
  timestamp: {
    color: "#72767d",
    fontSize: 12,
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

export default ChatChannel;
