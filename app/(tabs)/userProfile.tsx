import { UserMetadata } from "@/types/types";
import api from "@/utils/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView, // Import this
  Platform,
  Pressable, // Import this to check OS
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export default function ConnectionPage() {
  const systemTheme = useColorScheme();
  const isDark = systemTheme === "dark";

  const theme = {
    background: isDark ? "#121212" : "#F4F6F8",
    cardBg: isDark ? "#1E1E1E" : "#FFFFFF",
    text: isDark ? "#E0E0E0" : "#2D3748",
    subText: isDark ? "#A0AEC0" : "#718096",
    inputBg: isDark ? "#2D2D2D" : "#EDF2F7",
    inputBorder: isDark ? "#4A5568" : "#E2E8F0",
    primary: "#667EEA",
    onPrimary: "#FFFFFF",
  };

  const [displayName, setDisplayName] = useState("");
  const [status, setStatus] = useState("");
  const [userName, setUserName] = useState("");
  const [img, setImg] = useState("Not implemented yet");
  const [loading, setLoading] = useState(false);

  const animationValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const currentUsername = await AsyncStorage.getItem("currentUsername");
        if (currentUsername) {
          const data: any = await api.getUserData(currentUsername);
          if (data && data[0]) {
            setUserName(currentUsername);
            setDisplayName(data[0].display_name);
            setStatus(data[0].status);
            Animated.spring(animationValue, {
              toValue: 1,
              speed: 0.5,
              useNativeDriver: false,
            }).start();
          }
        }
      } catch (error) {
        console.log("Error fetching data :", error);
      }
    };
    loadUserData();
  }, []);

  const handleValidate = async () => {
    setLoading(true);
    try {
      const newUserData: UserMetadata = {
        username: userName,
        display_name: displayName,
        status: status,
        img: img,
      };
      await api.postNewUserData(newUserData);
    } catch (error) {
      console.log(`Error while modifying data: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    // 1. KeyboardAvoidingView must be the top-level wrapper with flex: 1
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20} // Tweak this if header interferes
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { backgroundColor: theme.background },
        ]}
        keyboardShouldPersistTaps="handled" // Allows pressing button while keyboard is open
      >
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

        <View style={[styles.card, { backgroundColor: theme.cardBg }]}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: theme.inputBg }]}>
              <Text style={{ fontSize: 24, color: theme.subText }}>📷</Text>
            </View>
            <Text style={[styles.usernameText, { color: theme.text }]}>
              @{userName || "username"}
            </Text>
          </View>

          <Animated.Text style={[styles.sectionTitle, { color: theme.text }]}>
            Edit Profile
          </Animated.Text>

          <View style={styles.inputContainer}>
            <Animated.Text
              style={[
                styles.label,
                {
                  color: theme.subText,
                  opacity: animationValue,
                  transform: [{ scale: animationValue }],
                },
              ]}
            >
              Display Name
            </Animated.Text>
            <AnimatedTextInput
              style={[
                styles.textInputs,
                {
                  backgroundColor: theme.inputBg,
                  color: theme.text,
                  borderColor: theme.inputBorder,
                  opacity: animationValue,
                  transform: [{ scale: animationValue }],
                },
              ]}
              placeholder=""
              value={displayName}
              onChangeText={setDisplayName}
              placeholderTextColor={theme.subText}
            />

            <Animated.Text
              style={[
                styles.label,
                {
                  color: theme.subText,
                  opacity: animationValue,
                  transform: [{ scale: animationValue }],
                },
              ]}
            >
              Status
            </Animated.Text>
            <AnimatedTextInput
              style={[
                styles.textInputs,
                {
                  backgroundColor: theme.inputBg,
                  color: theme.text,
                  borderColor: theme.inputBorder,
                  opacity: animationValue,
                  transform: [{ scale: animationValue }],
                },
              ]}
              placeholder="What's on your mind?"
              value={status}
              onChangeText={setStatus}
              placeholderTextColor={theme.subText}
            />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: theme.primary, opacity: pressed ? 0.9 : 1 },
            ]}
            onPress={handleValidate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={theme.onPrimary} />
            ) : (
              <Text style={[styles.buttonText, { color: theme.onPrimary }]}>
                Save Changes
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // Changed from 'container' to 'scrollContainer'
  scrollContainer: {
    flexGrow: 1, // Ensures content is centered if it's small, but scrollable if large
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 20,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 25,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  usernameText: {
    fontSize: 16,
    fontWeight: "600",
    opacity: 0.8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "left",
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
    fontWeight: "500",
    marginLeft: 4,
  },
  textInputs: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});
