// utils/notifications.ts
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

let notificationsRefused = false;
let activeChannelId: string | null = null;

export const setActiveChannel = (id: string | null) => {
  activeChannelId = id;
};

export const resetNotificationConfig = () => {
  activeChannelId = null;
};

// 1. Initialisation globale du comportement au premier plan
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    console.log("--- HANDLER TRIGGERED ---");

    const data = notification.request.content.data;
    const incomingChannelId = data?.channel_id?.toString();

    console.log("Active:", activeChannelId, "Incoming:", incomingChannelId);

    // Si on est déjà dans le channel du message, on bloque la notif visuelle/sonore
    const shouldDisplay = activeChannelId !== incomingChannelId;

    return {
      shouldPlaySound: shouldDisplay,
      shouldSetBadge: shouldDisplay,
      shouldShowAlert: shouldDisplay,
      // Si tu as des erreurs TS sur Banner/List, garde uniquement shouldShowAlert
      shouldShowBanner: shouldDisplay,
      shouldShowList: shouldDisplay,
    };
  },
});

export const getNotificationsPermission = async () => {
  if (notificationsRefused) return false;

  // 2. Configuration spécifique Android pour forcer le volet (Heads-up)
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("tenropes-messages", {
      name: "Messages",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (finalStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    notificationsRefused = true;
    return false;
  }
  return true;
};
