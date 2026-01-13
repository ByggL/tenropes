import ChannelCard from "@/components/channelCard";
import { Text, View } from "@/components/Themed"; // 1. Use Themed components
import Colors from "@/constants/Colors"; // 2. Import Colors
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  useColorScheme, // 3. Import hook
} from "react-native";
import { ChannelMetadata } from "../../types/types";
import api from "../../utils/api";

export default function ChannelSelectionPage() {
  const [channels, setChannels] = useState<ChannelMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  // 4. Get Current Theme
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  const fetchChannels = async () => {
    try {
      const channelsData = await api.getChannels();
      setChannels(channelsData);
    } catch (error) {
      console.error("Error fetching channels:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchChannels();
    }, [])
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <Text
          style={[
            styles.headerTitle,
            { color: colorScheme === "dark" ? theme.text : "#1A4D8C" },
          ]}
        >
          My Channels
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.subText }]}>
          Select a channel to start messenging !
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.tint} />
        </View>
      ) : (
        <FlatList
          data={channels}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <ChannelCard channelMetadata={item} onUpdate={fetchChannels} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: theme.subText }]}>
                No channels found.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Background handled inline
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    // Background handled inline
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 5,
    // Color handled inline
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: "500",
    // Color handled inline
  },
  listContent: {
    paddingBottom: 40,
    paddingTop: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    // Color handled inline
  },
});
