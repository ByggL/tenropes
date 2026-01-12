import ChannelCard from "@/components/channelCard"; // Import the new component
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ChannelMetadata } from "../../types/types";
import api from "../../utils/api";

export default function ChannelSelectionPage() {
  const [channels, setChannels] = useState<ChannelMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const fetchChannels = async () => {
        try {
          setLoading(true);
          const channelsData = await api.getChannels();
          setChannels(channelsData);
        } catch (error) {
          console.error("Error fetching channels:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchChannels();
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Channels</Text>
        <Text style={styles.headerSubtitle}>
          Select a channel to start messenging !{" "}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={channels}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <ChannelCard channelMetadata={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No channels found.</Text>
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
    backgroundColor: "#F9FAFB", // Very light grey/blue background
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: "#F9FAFB",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1A4D8C", // Brand Dark Blue
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
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
    color: "#999",
    fontSize: 16,
  },
});
