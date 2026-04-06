// app/(tabs)/_layout.tsx
import { useClientOnlyValue } from "@/components/useClientOnlyValue";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { AppDispatch, RootState } from "@/store";
import { registerPushToken } from "@/store/serverThunks";
import { getNotificationsPermission } from "@/utils/notifications";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Tabs, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

function TabBarIcon(props: { name: React.ComponentProps<typeof FontAwesome>["name"]; color: string }) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const accounts = useSelector((state: RootState) => state.servers.accounts);

  useEffect(() => {
    const syncPushTokens = async () => {
      const hasPermission = await getNotificationsPermission();
      if (!hasPermission) return;

      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      if (!projectId) return;

      try {
        const tokenRequest = await Notifications.getExpoPushTokenAsync({ projectId });
        const expoToken = tokenRequest.data;

        // La vue délègue la complexité à Redux
        Object.values(accounts).forEach((server) => {
          if (server.status === "CONNECTED" && server.pushToken !== expoToken) {
            dispatch(registerPushToken({ serverId: server.serverId, expoToken }));
          }
        });
      } catch (error) {
        console.error("Erreur récupération Expo Push Token:", error);
      }
    };

    if (Object.keys(accounts).length > 0) {
      syncPushTokens();
    }
  }, [accounts, dispatch]);

  useEffect(() => {
    if (Object.keys(accounts).length === 0) {
      const timer = setTimeout(() => {
        router.push("/add-server");
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [accounts, router]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: useClientOnlyValue(false, true),
      }}
    >
      <Tabs.Screen
        name="channelPage"
        options={{
          title: "Connected",
          headerShown: false,
          href: null, // Hidden from bottom bar
          tabBarIcon: ({ color }) => <TabBarIcon name="bell" color={color} />,
        }}
      />
      <Tabs.Screen
        name="channelSelectionPage"
        options={{
          title: "Channels",
          headerShown: false,
          tabBarIcon: ({ color }) => <TabBarIcon name="comments" color={color} />,
        }}
      />
      <Tabs.Screen
        name="createChannel"
        options={{
          headerShown: false,
          title: "Create",
          tabBarIcon: ({ color }) => <TabBarIcon name="plus" color={color} />,
        }}
      />
      {/* NEW: The Manage Servers Tab */}
      <Tabs.Screen
        name="manageServers"
        options={{
          headerShown: false,
          title: "Servers",
          tabBarIcon: ({ color }) => <TabBarIcon name="server" color={color} />,
        }}
      />
      <Tabs.Screen
        name="userProfile"
        options={{
          title: "Profile",
          headerShown: false,
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
        }}
      />
    </Tabs>
  );
}
