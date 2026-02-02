import { NotificationData } from "@/types/types";
import api from "@/utils/api";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { AndroidNotificationPriority } from "expo-notifications";
import { Platform } from "react-native";

let notificationsRefused = false;

export const pullAndPostToken = async () => {
  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId;
  console.log(projectId);
  if (!projectId) {
    console.error("Problem with project id");
  }
  try {
    const pushTokenString = (
      await Notifications.getExpoPushTokenAsync({ projectId })
    ).data;
    console.log("Hello, your push token :");
    console.log(pushTokenString);
    await api.postPushToken(pushTokenString);
  } catch (e) {
    throw new Error("Error while fetching and pushing expo push token ");
  }
};

export const setupNotifChannel = async () => {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("myNotificationChannel", {
      name: "A channel is needed for the permissions prompt to appear",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
    console.log("channel setuped");
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        priority: AndroidNotificationPriority.HIGH, // Android
        shouldPlaySound: false, // Sur android, pas de notif!
        shouldSetBadge: false, // iOS
        shouldShowBanner: true, // iOS
        shouldShowList: true, // iOS : est-elle affichée dans la liste de notifs ?
      }),
    });
  }
};

export const getNotificationsPermission = async () => {
  if (notificationsRefused) {
    return false;
  }

  if (true) {
    {
      /* device.isDevice*/
    }
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (finalStatus !== "granted" && !notificationsRefused) {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      console.error("Notifications refusées");
      notificationsRefused = true;
      return false;
    }
  }
  return false;
};

export const triggerNotification = async (
  notificationData: NotificationData,
) => {
  if (await getNotificationsPermission()) {
    console.log("testeuh");
    await Notifications.scheduleNotificationAsync({
      content: {
        title: notificationData.title,
        body: notificationData.body,
      },
      trigger: null,
    });
    console.log("fin de testeuh ");
  }
};
