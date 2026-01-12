import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

interface ChannelFormData {
  name: string;
  img: string;
}

interface ChannelFormProps {
  initialData?: ChannelFormData;
  onSubmit: (data: ChannelFormData) => Promise<void>;
  submitLabel: string;
  onCancel?: () => void;
  loading?: boolean;
}

export default function ChannelForm({
  initialData,
  onSubmit,
  submitLabel,
  onCancel,
  loading = false,
}: ChannelFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [img, setImg] = useState(initialData?.img || "");

  const handleSubmit = () => {
    onSubmit({ name, img });
  };

  return (
    <View style={styles.formContainer}>
      <Text style={styles.label}>Channel Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter channel name"
        placeholderTextColor="#A0AEC0"
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Channel Image URL (Optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="https://example.com/logo.png"
        placeholderTextColor="#A0AEC0"
        value={img}
        onChangeText={setImg}
        autoCapitalize="none"
      />

      <View style={styles.buttonRow}>
        {onCancel && (
          <Pressable
            style={[styles.button, styles.buttonCancel]}
            onPress={onCancel}
            disabled={loading}
          >
            <Text style={styles.buttonCancelText}>Cancel</Text>
          </Pressable>
        )}

        <Pressable
          style={[styles.button, styles.buttonSubmit]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonSubmitText}>{submitLabel}</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    width: "100%",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4A5568",
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    fontSize: 16,
    color: "#2D3748",
    backgroundColor: "#F7FAFC",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    gap: 10,
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonSubmit: {
    backgroundColor: "#667EEA",
    shadowColor: "#667EEA",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonCancel: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#CBD5E0",
  },
  buttonSubmitText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  buttonCancelText: {
    color: "#718096",
    fontWeight: "600",
    fontSize: 16,
  },
});
