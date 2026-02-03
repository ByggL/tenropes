// utils/notifications.ts
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import api from "./api";

let notificationsRefused = false;
let activeChannelId: string | null = null;

export const setActiveChannel = (id: string | null) => {
  activeChannelId = id;
};

export const resetNotificationConfig = () => {
  activeChannelId = null;
};

export const pullAndPostToken = async () => {
  Notifications.setNotificationHandler(null as any);

  const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;

  if (!projectId) {
    console.error("Problem with project id");
    return;
  }

  try {
    const tokenRequest = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    const pushTokenString = tokenRequest.data;

    await api.postPushToken(pushTokenString);

    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        // Log immédiat pour vérifier si le handler est touché
        console.log("--- HANDLER TRIGGERED ---");

        const data = notification.request.content.data;
        const incomingChannelId = data?.channel_id?.toString();

        // On log les variables de comparaison
        console.log("Active:", activeChannelId, "Incoming:", incomingChannelId);
        console.log("Full Data:", JSON.stringify(data, null, 2));

        const shouldDisplay = activeChannelId !== incomingChannelId;

        return {
          shouldPlaySound: shouldDisplay,
          shouldSetBadge: shouldDisplay,
          shouldShowBanner: shouldDisplay,
          shouldShowList: shouldDisplay,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        };
      },
    });
  } catch (e) {
    console.error("Error notifications:", e);
  }
};

export const getNotificationsPermission = async () => {
  if (notificationsRefused) return false;

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
  return true; // Retourne true si on a les perms
};
