import { NotificationData } from "@/types/types";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

let notificationsRefused = false;

export const setupNotifChannel = async () => {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("myNotificationChannel", {
      name: "A channel is needed for the permissions prompt to appear",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
    console.log("channel setuped");
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
