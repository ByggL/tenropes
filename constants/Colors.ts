import { StatusBarStyle } from "expo-status-bar";

const tintColorLight = "#2f95dc";
const tintColorDark = "#fff";

export default {
  light: {
    barStyle: "dark-content" as StatusBarStyle,
    text: "#000",
    textSecondary: "#666",
    background: "#fff",
    backgroundSecondary: "#f2f2f2",
    tint: tintColorLight,
    tabIconDefault: "#ccc",
    tabIconSelected: tintColorLight,
    border: "#ddd",
    inputBackground: "#f9f9f9",
    cardBg: "#FFFFFF",
    subText: "#718096",
    inputBg: "#EDF2F7",
    inputBorder: "#E2E8F0",
    primary: "#667EEA",
    onPrimary: "#FFFFFF",
    overlay: "rgba(0, 0, 0, 0.5)",
  },
  dark: {
    barStyle: "light-content" as StatusBarStyle,
    text: "#fff",
    textSecondary: "#aaa",
    background: "#1E1E1E",
    backgroundSecondary: "#1c1c1e",
    tint: tintColorDark,
    tabIconDefault: "#ccc",
    tabIconSelected: tintColorDark,
    border: "#333",
    inputBackground: "#2c2c2e",
    cardBg: "#1E1E1E",
    subText: "#A0AEC0",
    inputBg: "#2D2D2D",
    inputBorder: "#4A5568",
    primary: "#667EEA",
    onPrimary: "#FFFFFF",
    overlay: "rgba(0, 0, 0, 0.7)",
  },
};
