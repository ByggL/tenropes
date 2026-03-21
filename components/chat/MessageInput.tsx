import { ChannelMetadata } from "@/types/types";
import { optimizeThemeForReadability } from "@/utils/utils";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type MessageInputProps = {
  channel: ChannelMetadata;
  inputText: string;
  setInputText: React.Dispatch<React.SetStateAction<string>>;
  handleSend: (imageFile?: File | Blob) => void;
};

export default function MessageInput({ channel, inputText, setInputText, handleSend }: MessageInputProps) {
  const insets = useSafeAreaInsets();
  const [selectedImage, setSelectedImage] = useState<ImagePicker.ImagePickerAsset | null>(null);

  const theme = channel?.theme
    ? optimizeThemeForReadability(channel.theme)
    : {
        primary_color: "#E91E63",
        primary_color_dark: "#C2185B",
        accent_color: "#00BCD4",
        text_color: "#212121",
        accent_text_color: "#FFFFFF",
      };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0]);
    }
  };

  const onSendInternal = () => {
    handleSend(selectedImage?.file || undefined);
    setSelectedImage(null);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 60}
      style={{ paddingBottom: insets.bottom }}
    >
      {selectedImage && (
        <View style={styles.previewContainer}>
          <Image source={{ uri: selectedImage?.uri }} style={styles.imagePreview} />
          <TouchableOpacity style={styles.removeImageButton} onPress={() => setSelectedImage(null)}>
            <Text style={styles.removeImageText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={[styles.inputContainer, { backgroundColor: theme.primary_color }]}>
        <TouchableOpacity style={styles.attachButton} onPress={pickImage}>
          <Text style={{ color: theme.accent_color, fontSize: 24 }}>+</Text>
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
          onSubmitEditing={onSendInternal}
        />

        <TouchableOpacity onPress={onSendInternal} style={styles.sendButton}>
          <Text style={{ color: theme.accent_color, fontWeight: "bold", fontSize: 20 }}>→</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  previewContainer: {
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 16,
  },
  imagePreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  removeImageButton: {
    position: "absolute",
    top: 5,
    left: 65,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  removeImageText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    margin: 16,
    borderRadius: 8,
    marginTop: 0,
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
