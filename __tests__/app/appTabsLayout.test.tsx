import React from "react";
import { act, create } from "react-test-renderer";

// ---- Mocks ----
const mockPush = jest.fn();
const capturedScreens: any[] = [];
jest.mock("expo-router", () => {
  const Tabs: any = ({ children }: any) => children;
  Tabs.Screen = (props: any) => {
    capturedScreens.push(props);
    return null;
  };
  return {
    Tabs,
    useRouter: () => ({ push: mockPush }),
  };
});

const mockUseColorScheme = jest.fn();
jest.mock("@/components/useColorScheme", () => ({
  useColorScheme: () => mockUseColorScheme(),
}));

jest.mock("@/components/useClientOnlyValue", () => ({
  useClientOnlyValue: (_a: any, b: any) => b,
}));

const mockDispatch = jest.fn();
const mockUseSelector = jest.fn();
jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector: any) => mockUseSelector(selector),
}));

jest.mock("@/store/serverThunks", () => ({
  registerPushToken: jest.fn((arg: any) => ({ type: "registerPushToken", payload: arg })),
}));
import { registerPushToken } from "@/store/serverThunks";

const mockGetPermission = jest.fn();
jest.mock("@/utils/notifications", () => ({
  getNotificationsPermission: () => mockGetPermission(),
}));

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { extra: { eas: {} } }, easConfig: {} },
}));
import Constants from "expo-constants";

const mockGetExpoPushTokenAsync = jest.fn();
jest.mock("expo-notifications", () => ({
  getExpoPushTokenAsync: (arg: any) => mockGetExpoPushTokenAsync(arg),
}));

jest.mock("@expo/vector-icons/FontAwesome", () => "FontAwesome");

import TabLayout from "../../app/(tabs)/_layout";

async function renderLayout() {
  let renderer: any;
  await act(async () => {
    renderer = create(<TabLayout />);
  });
  // allow the async syncPushTokens promise chain to settle
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
  return renderer;
}

function setAccounts(accounts: any) {
  mockUseSelector.mockImplementation((selector: any) => selector({ servers: { accounts } }));
}

describe("app/(tabs)/_layout.tsx", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    capturedScreens.length = 0;
    mockUseColorScheme.mockReturnValue("light");
    mockGetPermission.mockResolvedValue(true);
    mockGetExpoPushTokenAsync.mockResolvedValue({ data: "ExpoToken[NEW]" });
    (Constants as any).expoConfig = { extra: { eas: { projectId: "pid-123" } } };
    (Constants as any).easConfig = {};
    setAccounts({});
  });

  it("renders all tab screens and executes each tabBarIcon + TabBarIcon", async () => {
    setAccounts({ "http://a": { serverId: "http://a", status: "CONNECTED", pushToken: "ExpoToken[NEW]" } });
    const r = await renderLayout();
    // 5 Tabs.Screen captured
    expect(capturedScreens.length).toBe(5);
    // Invoke each tabBarIcon render fn to cover the arrow functions + TabBarIcon
    capturedScreens.forEach((screen) => {
      const icon = screen.options.tabBarIcon({ color: "#fff" });
      expect(icon).toBeTruthy();
      // Actually mount the returned element so TabBarIcon's body executes
      act(() => {
        create(icon);
      });
    });
    expect(r.toJSON()).not.toBeUndefined();
  });

  it("uses light theme fallback when colorScheme is null", async () => {
    mockUseColorScheme.mockReturnValue(null);
    setAccounts({ "http://a": { serverId: "http://a", status: "CONNECTED", pushToken: "ExpoToken[NEW]" } });
    await renderLayout();
    // Colors[colorScheme ?? "light"] path exercised; screens still captured
    expect(capturedScreens.length).toBe(5);
  });

  it("does not sync push tokens when there are no accounts", async () => {
    setAccounts({});
    await renderLayout();
    expect(mockGetPermission).not.toHaveBeenCalled();
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it("returns early when notification permission is denied", async () => {
    mockGetPermission.mockResolvedValue(false);
    setAccounts({ "http://a": { serverId: "http://a", status: "CONNECTED", pushToken: "x" } });
    await renderLayout();
    expect(mockGetPermission).toHaveBeenCalled();
    expect(mockGetExpoPushTokenAsync).not.toHaveBeenCalled();
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it("returns early when no projectId can be resolved", async () => {
    (Constants as any).expoConfig = { extra: { eas: {} } };
    (Constants as any).easConfig = {};
    setAccounts({ "http://a": { serverId: "http://a", status: "CONNECTED", pushToken: "x" } });
    await renderLayout();
    expect(mockGetExpoPushTokenAsync).not.toHaveBeenCalled();
  });

  it("falls back to easConfig.projectId when expoConfig has none", async () => {
    (Constants as any).expoConfig = { extra: { eas: {} } };
    (Constants as any).easConfig = { projectId: "eas-pid" };
    setAccounts({ "http://a": { serverId: "http://a", status: "CONNECTED", pushToken: "old" } });
    await renderLayout();
    expect(mockGetExpoPushTokenAsync).toHaveBeenCalledWith({ projectId: "eas-pid" });
    expect(mockDispatch).toHaveBeenCalled();
  });

  it("dispatches registerPushToken only for connected servers whose token changed", async () => {
    setAccounts({
      "http://a": { serverId: "http://a", status: "CONNECTED", pushToken: "old" }, // -> dispatch
      "http://b": { serverId: "http://b", status: "CONNECTED", pushToken: "ExpoToken[NEW]" }, // same token -> skip
      "http://c": { serverId: "http://c", status: "OFFLINE", pushToken: "old" }, // not connected -> skip
    });
    await renderLayout();
    expect(mockGetExpoPushTokenAsync).toHaveBeenCalledWith({ projectId: "pid-123" });
    expect(registerPushToken).toHaveBeenCalledTimes(1);
    expect(registerPushToken).toHaveBeenCalledWith({ serverId: "http://a", expoToken: "ExpoToken[NEW]" });
    expect(mockDispatch).toHaveBeenCalledTimes(1);
  });

  it("logs an error when getExpoPushTokenAsync throws", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockGetExpoPushTokenAsync.mockRejectedValue(new Error("boom"));
    setAccounts({ "http://a": { serverId: "http://a", status: "CONNECTED", pushToken: "old" } });
    await renderLayout();
    expect(consoleErrorSpy).toHaveBeenCalledWith("Erreur récupération Expo Push Token:", expect.any(Error));
    consoleErrorSpy.mockRestore();
  });

  it("navigates to /add-server after a delay when there are no accounts, and clears the timer on unmount", async () => {
    jest.useFakeTimers();
    setAccounts({});
    let renderer: any;
    await act(async () => {
      renderer = create(<TabLayout />);
    });
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(mockPush).toHaveBeenCalledWith("/add-server");

    // cover the clearTimeout cleanup branch
    const clearSpy = jest.spyOn(global, "clearTimeout");
    act(() => {
      renderer.unmount();
    });
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
    jest.useRealTimers();
  });

  it("does not schedule navigation when accounts exist", async () => {
    jest.useFakeTimers();
    setAccounts({ "http://a": { serverId: "http://a", status: "CONNECTED", pushToken: "ExpoToken[NEW]" } });
    await act(async () => {
      create(<TabLayout />);
    });
    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(mockPush).not.toHaveBeenCalled();
    jest.useRealTimers();
  });
});
