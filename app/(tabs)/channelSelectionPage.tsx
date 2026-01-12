import ChannelCard from "@/components/channelCard";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { ChannelMetadata } from "../../types/api_types";
import api from "../../utils/api";

export default function ConnectionPage() {
  const [channels, setChannels] = useState<ChannelMetadata[]>([]);

  useFocusEffect(
    useCallback(() => {
      const fetchChannels = async () => {
        try {
          const channelsData = await api.getChannels();
          setChannels(channelsData);
        } catch (error) {
          console.error("Error fetching channels:", error);
        }
      };

      fetchChannels();

      // Optional: Return a cleanup function if needed (e.g., to cancel requests)
      return () => {};
    }, [])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.titles}>Select channel</Text>
      <FlatList
        data={channels}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <ChannelCard
            channelId={item.id}
            channelImg={item.img}
            channelName={item.name}
          />
        )}
        style={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 50,
  },
  titles: {
    fontWeight: "bold",
    fontSize: 20,
    marginBottom: 20,
  },
  list: {
    width: "100%",
  },
  // Styles for the ChannelCard
  cardContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    width: "100%",
  },
  cardImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    backgroundColor: "#ccc", // Fallback color
  },
  cardText: {
    fontSize: 16,
  },
});
