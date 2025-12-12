import { UserMetadata } from "@/types/api_types";
import api from "@/utils/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
export default function ConnectionPage() {
  const [displayName, setDisplayName] = useState("");
  const [status, setStatus] = useState("");
  const [userName, setUserName] = useState("");
  const [img, setImg] = useState("Not implemented yet");

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const currentUsername = await AsyncStorage.getItem("currentUsername");
        console.log(currentUsername);
        // Fetch the stored object
        if (currentUsername) {
          const data: any = await api.getUserData(currentUsername);
          setUserName(currentUsername);
          setDisplayName(data[0].display_name);
          setStatus(data[0].status);
        } else {
          console.log("No username foud");
        }
      } catch (error) {
        console.log("Error fetching data :", error);
      }
    };

    loadUserData();
  }, []);

  const handleValidate = async () => {
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
    }
  };
  const hasError: boolean = false;

  return (
    <View style={styles.container}>
      <Text>Image</Text>
      <Text style={styles.titles}>Username : </Text>
      <Text>{userName}</Text>
      <View>
        <TextInput
          style={styles.textInputs}
          placeholder="DisplayName"
          value={displayName}
          onChangeText={setDisplayName}
          keyboardType="default"
          autoCapitalize="none"
          placeholderTextColor="#999"
        />
        <TextInput
          style={styles.textInputs}
          placeholder="Update your status"
          value={status}
          onChangeText={setStatus}
          keyboardType="default"
          autoCapitalize="none"
          placeholderTextColor="#999"
        />
      </View>
      <Pressable onPress={handleValidate}>
        <Text>Validate</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  titles: {
    fontWeight: "bold",
    fontSize: 20,
  },
  textInputs: {
    height: 50,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: "#fafafa",
    color: "#333",
  },
  errorMessage: {
    color: "red",
    fontSize: 10,
  },
});
