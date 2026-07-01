import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { resetNotificationConfig, setActiveChannel, getNotificationsPermission } from "../utils/notifications";

let capturedHandler: any;

jest.mock("expo-notifications", () => {
  return {
    setNotificationHandler: jest.fn((config) => {
      capturedHandler = config.handleNotification;
    }),
    setNotificationChannelAsync: jest.fn().mockResolvedValue(null),
    getPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
    requestPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
    AndroidImportance: {
      MAX: 5,
    },
  };
});

describe("Notifications Utility", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetNotificationConfig();
    
    // Set default mock implementations
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: "granted" });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: "granted" });
  });

  describe("setNotificationHandler", () => {
    it("should register the notification handler and handle notifications correctly", async () => {
      expect(capturedHandler).toBeDefined();

      // Test handler when activeChannelId is null
      resetNotificationConfig();
      const notif1 = {
        request: {
          content: {
            data: { channel_id: 123 },
          },
        },
      };
      let result = await capturedHandler(notif1);
      expect(result.shouldPlaySound).toBe(true);

      // Test handler when activeChannelId matches incoming channel id
      setActiveChannel("123");
      result = await capturedHandler(notif1);
      expect(result.shouldPlaySound).toBe(false);

      // Test handler when activeChannelId does not match incoming channel id
      setActiveChannel("456");
      result = await capturedHandler(notif1);
      expect(result.shouldPlaySound).toBe(true);

      // Test handler when no data or channel_id is present
      const notifNoData = {
        request: {
          content: {},
        },
      };
      result = await capturedHandler(notifNoData);
      expect(result.shouldPlaySound).toBe(true);
    });
  });

  describe("getNotificationsPermission", () => {
    it("should return false immediately if permissions were previously refused", async () => {
      // First run: refuse permission
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: "denied" });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: "denied" });

      const firstResult = await getNotificationsPermission();
      expect(firstResult).toBe(false);

      // Second run: should return false immediately without checking
      jest.clearAllMocks();
      const secondResult = await getNotificationsPermission();
      expect(secondResult).toBe(false);
      expect(Notifications.getPermissionsAsync).not.toHaveBeenCalled();
    });

    it("should request permissions if not already granted, and return true if granted", async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: "undetermined" });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: "granted" });

      const result = await getNotificationsPermission();
      expect(result).toBe(true);
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
    });

    it("should return true immediately if permission is already granted", async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: "granted" });

      const result = await getNotificationsPermission();
      expect(result).toBe(true);
      expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    });

    it("should set notification channel on Android", async () => {
      const originalOS = Platform.OS;
      Object.defineProperty(Platform, "OS", { value: "android", configurable: true });

      const result = await getNotificationsPermission();
      expect(result).toBe(true);
      expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith("tenropes-messages", {
        name: "Messages",
        importance: 5,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });

      Object.defineProperty(Platform, "OS", { value: originalOS, configurable: true });
    });
  });
});
