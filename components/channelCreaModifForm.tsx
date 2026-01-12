import { Theme } from "@/types/types";
import React, { useState } from "react";
import {
  ActivityIndicator,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
} from "react-native";
import ColorPicker, {
  HueSlider,
  Panel1,
  PreviewText,
  Swatches,
} from "reanimated-color-picker";
// 1. Import runOnJS to handle thread switching
import { runOnJS } from "react-native-reanimated";

// Enable LayoutAnimation for Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ChannelFormData {
  name: string;
  img: string;
  theme: Theme;
}

interface ChannelFormProps {
  initialData?: ChannelFormData;
  onSubmit: (data: ChannelFormData) => Promise<void>;
  submitLabel: string;
  onCancel?: () => void;
  loading?: boolean;
}

// Default Presets
const PRESETS = [
  {
    name: "Default Pink",
    theme: {
      primary_color: "#E91E63",
      primary_color_dark: "#C2185B",
      accent_color: "#00BCD4",
      text_color: "#212121",
      accent_text_color: "#FFFFFF",
    },
  },
  {
    name: "Ocean Blue",
    theme: {
      primary_color: "#1976D2",
      primary_color_dark: "#0D47A1",
      accent_color: "#FFC107",
      text_color: "#212121",
      accent_text_color: "#FFFFFF",
    },
  },
  {
    name: "Forest Green",
    theme: {
      primary_color: "#388E3C",
      primary_color_dark: "#1B5E20",
      accent_color: "#8BC34A",
      text_color: "#212121",
      accent_text_color: "#FFFFFF",
    },
  },
  {
    name: "Dark Night",
    theme: {
      primary_color: "#212121",
      primary_color_dark: "#000000",
      accent_color: "#BB86FC",
      text_color: "#E0E0E0",
      accent_text_color: "#000000",
    },
  },
];

export default function ChannelForm({
  initialData,
  onSubmit,
  submitLabel,
  onCancel,
  loading = false,
}: ChannelFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [img, setImg] = useState(initialData?.img || "");
  const [theme, setTheme] = useState<Theme>(
    initialData?.theme || PRESETS[0].theme
  );

  const [showAdvanced, setShowAdvanced] = useState(false);

  // --- Picker State ---
  const [pickerVisible, setPickerVisible] = useState(false);
  const [activeColorKey, setActiveColorKey] = useState<keyof Theme | null>(
    null
  );
  const [tempColor, setTempColor] = useState("#FFFFFF");

  const handlePresetSelect = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  const handleManualTextChange = (key: keyof Theme, value: string) => {
    setTheme((prev) => ({ ...prev, [key]: value }));
  };

  const openPicker = (key: keyof Theme) => {
    setActiveColorKey(key);
    setTempColor(theme[key]);
    setPickerVisible(true);
  };

  // 2. This is the JS function that updates state
  const updateColorState = (color: { hex: string }) => {
    if (activeColorKey) {
      setTheme((prev) => ({ ...prev, [activeColorKey]: color.hex }));
    }
  };

  // 3. This is the wrapper "worklet" that calls runOnJS
  const onColorSelect = (color: { hex: string }) => {
    "worklet"; // Mark this function as runnable on UI thread
    runOnJS(updateColorState)(color); // Dispatch back to JS thread
  };

  const toggleAdvanced = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowAdvanced(!showAdvanced);
  };

  const handleSubmit = () => {
    onSubmit({ name, img, theme });
  };

  return (
    <View style={styles.formContainer}>
      {/* --- Visual Color Picker Modal --- */}
      <Modal visible={pickerVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerTitle}>Select Color</Text>

            <ColorPicker
              style={{ width: "100%", gap: 20 }}
              value={tempColor}
              onComplete={onColorSelect} // Pass the worklet wrapper here
            >
              <PreviewText
                style={{ color: "#000", fontSize: 18, fontWeight: "bold" }}
              />
              <Panel1 />
              <HueSlider />
              <Swatches />
            </ColorPicker>

            <Pressable
              style={styles.closePickerButton}
              onPress={() => setPickerVisible(false)}
            >
              <Text style={styles.closePickerText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Text style={styles.label}>Channel Name</Text>
      <TextInput
        style={styles.input}
        placeholder="# general"
        placeholderTextColor="#A0AEC0"
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Channel Image URL</Text>
      <TextInput
        style={styles.input}
        placeholder="https://example.com/logo.png"
        placeholderTextColor="#A0AEC0"
        value={img}
        onChangeText={setImg}
        autoCapitalize="none"
      />

      <Text style={styles.sectionTitle}>Channel Theme</Text>

      {/* Presets */}
      <View style={styles.presetsContainer}>
        {PRESETS.map((preset, index) => (
          <Pressable
            key={index}
            onPress={() => handlePresetSelect(preset.theme)}
            style={[
              styles.presetCircle,
              { backgroundColor: preset.theme.primary_color },
              theme.primary_color === preset.theme.primary_color &&
                styles.presetActive,
            ]}
          />
        ))}
      </View>

      <Pressable onPress={toggleAdvanced} style={styles.advancedToggle}>
        <Text style={styles.advancedToggleText}>
          {showAdvanced ? "Hide Color Options ▲" : "Edit Specific Colors ▼"}
        </Text>
      </Pressable>

      {/* Advanced Inputs */}
      {showAdvanced && (
        <View style={styles.advancedContainer}>
          {Object.keys(theme).map((key) => {
            const fieldKey = key as keyof Theme;
            return (
              <View key={fieldKey} style={styles.colorRow}>
                <Pressable
                  onPress={() => openPicker(fieldKey)}
                  style={[
                    styles.colorPreview,
                    { backgroundColor: theme[fieldKey] },
                  ]}
                >
                  <Text style={styles.editIcon}>✎</Text>
                </Pressable>

                <View style={{ flex: 1 }}>
                  <Text style={styles.colorLabel}>
                    {fieldKey.replace(/_/g, " ").toUpperCase()}
                  </Text>
                  <TextInput
                    style={styles.colorInput}
                    value={theme[fieldKey]}
                    onChangeText={(text) =>
                      handleManualTextChange(fieldKey, text)
                    }
                    autoCapitalize="none"
                  />
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Buttons */}
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2D3748",
    marginTop: 10,
    marginBottom: 10,
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
  presetsContainer: {
    flexDirection: "row",
    gap: 15,
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  presetCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "transparent",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  presetActive: {
    borderColor: "#2D3748",
    borderWidth: 3,
    transform: [{ scale: 1.1 }],
  },
  advancedToggle: {
    paddingVertical: 10,
    marginBottom: 10,
  },
  advancedToggleText: {
    color: "#667EEA",
    fontWeight: "600",
  },
  advancedContainer: {
    marginBottom: 20,
    backgroundColor: "#F7FAFC",
    padding: 10,
    borderRadius: 12,
  },
  colorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  colorPreview: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  editIcon: {
    fontSize: 12,
    color: "rgba(0,0,0,0.3)",
  },
  colorLabel: {
    fontSize: 10,
    color: "#718096",
    marginBottom: 2,
  },
  colorInput: {
    height: 36,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 14,
    backgroundColor: "#FFFFFF",
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
  // --- Picker Modal Styles ---
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  pickerContainer: {
    backgroundColor: "white",
    width: "100%",
    maxWidth: 350,
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
    elevation: 5,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#2D3748",
  },
  closePickerButton: {
    marginTop: 20,
    backgroundColor: "#667EEA",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  closePickerText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
