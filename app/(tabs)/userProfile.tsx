// app/(tabs)/userProfile.tsx
import { DisconnectButton } from "@/components/disconnectButton";
import { Text, View } from "@/components/Themed";
import Colors from "@/constants/Colors";
import { UserMetadata } from "@/types/types";
import { API } from "@/utils/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  useColorScheme,
} from "react-native";

// Redux Imports
import { RootState } from "@/store";
import { useDispatch, useSelector } from "react-redux";
import { removeServer } from "../../store/serversSlice";

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export default function UserProfilePage() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  const router = useRouter();
  const dispatch = useDispatch();

  // Get all active servers from Redux
  const accounts = useSelector((state: RootState) => state.servers.accounts);

  const [disconnecting, setDisconnecting] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [status, setStatus] = useState("");
  const [userName, setUserName] = useState("");
  const [img, setImg] = useState("");
  const [loading, setLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [tempImg, setTempImg] = useState("");

  const animationValue = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      const loadUserData = async () => {
        try {
          const serverList = Object.values(accounts);
          if (serverList.length === 0) return;

          // Fetch profile data from the first active server to populate the form
          const firstServer = serverList[0];
          const apiClient = new API(firstServer.serverId);

          const data: any = await apiClient.getUserData([firstServer.username]);

          if (data && data[0]) {
            setUserName(firstServer.username);
            setDisplayName(data[0]?.display_name || "");
            setStatus(data[0]?.status || "");
            setImg(data[0]?.img || "");

            Animated.spring(animationValue, {
              toValue: 1,
              speed: 0.5,
              useNativeDriver: false,
            }).start();
          }
        } catch (error) {
          console.log("Error fetching data:", error);
        }
      };

      loadUserData();
      return () => {};
    }, [accounts]),
  );

  const handleOpenImageDialog = () => {
    setTempImg(img);
    setModalVisible(true);
  };

  const handleSaveImageUri = () => {
    setImg(tempImg);
    setModalVisible(false);
  };

  const handleValidate = async () => {
    setLoading(true);
    try {
      const newUserData: UserMetadata = {
        username: userName,
        display_name: displayName,
        status: status,
        img: img,
      };

      // Push profile updates to ALL connected servers
      const serverList = Object.values(accounts);
      const updatePromises = serverList.map(async (server) => {
        if (server.status === "SESSION_EXPIRED") return;
        const apiClient = new API(server.serverId);
        return apiClient.postNewUserData(newUserData);
      });

      await Promise.allSettled(updatePromises);
      Alert.alert("Success", "Profile updated across all servers!");
    } catch (error) {
      console.log(`Error while modifying data: ${error}`);
      Alert.alert("Error", "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleOnDisconnect = () => {
    Alert.alert("Reset App?", "This will log you out of EVERY server and delete all local data. Continue?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Wipe Everything",
        style: "destructive",
        onPress: async () => {
          setDisconnecting(true);
          // Loop through all and remove
          const serverIds = Object.keys(accounts);
          for (const id of serverIds) {
            dispatch(removeServer(id));
          }
          await AsyncStorage.clear(); // Complete wipe
          router.replace("/add-server");
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContainer, { backgroundColor: theme.inputBg }]}
        keyboardShouldPersistTaps="handled"
      >
        <StatusBar barStyle={colorScheme === "dark" ? "light-content" : "dark-content"} />

        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}>
            <View style={[styles.modalContent, { backgroundColor: theme.cardBg }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Change Profile Picture</Text>
              <Text style={[styles.modalSubtitle, { color: theme.subText }]}>Enter a public URL for your image.</Text>

              <TextInput
                style={[
                  styles.modalInput,
                  { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.inputBorder },
                ]}
                placeholder="https://example.com/image.png"
                placeholderTextColor={theme.subText}
                value={tempImg}
                onChangeText={setTempImg}
                autoCapitalize="none"
              />

              <View style={styles.modalButtons}>
                <Pressable style={[styles.modalButton, styles.buttonCancel]} onPress={() => setModalVisible(false)}>
                  <Text style={{ color: theme.subText }}>Cancel</Text>
                </Pressable>

                <Pressable
                  style={[styles.modalButton, { backgroundColor: theme.primary }]}
                  onPress={handleSaveImageUri}
                >
                  <Text style={{ color: theme.onPrimary, fontWeight: "bold" }}>Set Image</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        <View style={[styles.card, { backgroundColor: theme.cardBg }]}>
          <View style={styles.avatarContainer}>
            <Pressable
              onPress={handleOpenImageDialog}
              style={({ pressed }) => [styles.avatar, { backgroundColor: theme.inputBg, opacity: pressed ? 0.7 : 1 }]}
            >
              {img ? (
                <Image
                  source={{ uri: img }}
                  style={{ width: "100%", height: "100%", borderRadius: 40 }}
                  resizeMode="cover"
                />
              ) : (
                <Text style={{ fontSize: 24, color: theme.subText }}>📷</Text>
              )}
              <View style={styles.editIconOverlay}>
                <Text style={{ fontSize: 12, color: "#fff" }}>✎</Text>
              </View>
            </Pressable>
            <Text style={[styles.usernameText, { color: theme.text }]}>@{userName || "username"}</Text>
          </View>

          <Animated.Text style={[styles.sectionTitle, { color: theme.text }]}>Edit Profile</Animated.Text>

          <View style={styles.inputContainer}>
            <Animated.Text
              style={[
                styles.label,
                { color: theme.subText, opacity: animationValue, transform: [{ scale: animationValue }] },
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
              placeholder="Your display name"
              value={displayName}
              onChangeText={setDisplayName}
              placeholderTextColor={theme.subText}
            />

            <Animated.Text
              style={[
                styles.label,
                { color: theme.subText, opacity: animationValue, transform: [{ scale: animationValue }] },
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
            style={({ pressed }) => [styles.button, { backgroundColor: theme.primary, opacity: pressed ? 0.9 : 1 }]}
            onPress={handleValidate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={theme.onPrimary} />
            ) : (
              <Text style={[styles.buttonText, { color: theme.onPrimary }]}>Save Changes</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
      <DisconnectButton onPress={handleOnDisconnect} isLoading={disconnecting} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, alignItems: "center", justifyContent: "center", padding: 20 },
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
  avatarContainer: { alignItems: "center", marginBottom: 25 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    position: "relative",
  },
  editIconOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#667EEA",
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  usernameText: { fontSize: 16, fontWeight: "600", opacity: 0.8 },
  sectionTitle: { fontSize: 22, fontWeight: "bold", marginBottom: 20, textAlign: "left" },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 14, marginBottom: 6, fontWeight: "500", marginLeft: 4 },
  textInputs: { height: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 15, marginBottom: 15, fontSize: 16 },
  button: { height: 50, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 10 },
  buttonText: { fontSize: 16, fontWeight: "bold" },
  modalOverlay: { flex: 1, justifyContent: "center", alignItems: "center" },
  modalContent: {
    width: "80%",
    padding: 20,
    borderRadius: 16,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10, textAlign: "center" },
  modalSubtitle: { fontSize: 14, marginBottom: 15, textAlign: "center" },
  modalInput: { height: 45, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, marginBottom: 20 },
  modalButtons: { flexDirection: "row", justifyContent: "space-between" },
  modalButton: { flex: 1, padding: 10, borderRadius: 8, alignItems: "center", marginHorizontal: 5 },
  buttonCancel: { backgroundColor: "transparent", borderWidth: 1, borderColor: "#ccc" },
});
