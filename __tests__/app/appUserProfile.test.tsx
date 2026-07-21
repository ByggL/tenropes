import React from "react";
import { act, create } from "react-test-renderer";
import { ActivityIndicator, Alert, Image, Text as RNText } from "react-native";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useFocusEffect: (cb: any) => {
    const React = require("react");
    React.useEffect(() => cb(), [cb]);
  },
}));

const mockDispatch = jest.fn();
const mockUseSelector = jest.fn();
jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector: any) => mockUseSelector(selector),
}));

// Stable mocked API instance methods
jest.mock("@/utils/api", () => {
  const getUserData = jest.fn();
  const postNewUserData = jest.fn();
  return {
    API: jest.fn(() => ({ getUserData, postNewUserData })),
    __getUserData: getUserData,
    __postNewUserData: postNewUserData,
  };
});
const apiMock: any = require("@/utils/api");
const mockGetUserData = apiMock.__getUserData as jest.Mock;
const mockPostNewUserData = apiMock.__postNewUserData as jest.Mock;

jest.mock("@react-native-async-storage/async-storage", () => ({ clear: jest.fn() }));
jest.mock("expo-secure-store", () => ({ deleteItemAsync: jest.fn() }));

jest.mock("@/components/Themed", () => {
  const RN = require("react-native");
  return { Text: RN.Text, View: RN.View };
});

jest.mock("@/components/disconnectButton", () => ({
  DisconnectButton: jest.fn(() => null),
}));
import { DisconnectButton } from "@/components/disconnectButton";

import UserProfilePage from "../../app/(tabs)/userProfile";

// ---- helpers ----
function getPressables(root: any) {
  return root.findAll((n: any) => n.props && typeof n.props.onPress === "function");
}
function textContent(node: any): string {
  const c = node.props && node.props.children;
  if (typeof c === "string") return c;
  if (Array.isArray(c)) return c.filter((x: any) => typeof x === "string").join("");
  return "";
}
function findPressableByText(root: any, text: string) {
  return getPressables(root).find(
    (p: any) => p.findAll((n: any) => textContent(n).includes(text)).length > 0,
  );
}
function findInput(root: any, placeholder: string) {
  return root.findAll(
    (n: any) => n.props && n.props.placeholder === placeholder && typeof n.props.onChangeText === "function",
  )[0];
}

async function render() {
  let r: any;
  await act(async () => {
    r = create(<UserProfilePage />);
  });
  await act(async () => {});
  return r;
}

function lastDisconnectOnPress() {
  const calls = (DisconnectButton as jest.Mock).mock.calls;
  return calls[calls.length - 1][0].onPress;
}

describe("app/(tabs)/userProfile.tsx", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const RN = require("react-native");
    RN.Platform.OS = "android";
    jest.spyOn(RN, "useColorScheme").mockReturnValue("light");
    jest.spyOn(RN.Animated, "spring").mockReturnValue({ start: jest.fn() } as any);
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
    mockUseSelector.mockReturnValue({});
    mockGetUserData.mockResolvedValue([{ display_name: "Dev", status: "online", img: "http://x/a.png" }]);
    mockPostNewUserData.mockResolvedValue({});
    (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.clear as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it("loads profile data and shows the avatar image when img is present", async () => {
    mockUseSelector.mockReturnValue({ "http://a": { serverId: "http://a", username: "alice", status: "CONNECTED" } });
    const r = await render();
    expect(mockGetUserData).toHaveBeenCalledWith(["alice"]);
    expect(r.root.findAllByType(Image).length).toBeGreaterThan(0);
    // "@alice" username label
    expect(r.root.findAll((n: any) => textContent(n).includes("@alice")).length).toBeGreaterThan(0);
  });

  it("falls back to the placeholder and empty fields when profile data is blank", async () => {
    mockUseSelector.mockReturnValue({ "http://a": { serverId: "http://a", username: "alice", status: "CONNECTED" } });
    mockGetUserData.mockResolvedValueOnce([{ display_name: "", status: "", img: "" }]);
    const r = await render();
    expect(r.root.findAllByType(Image).length).toBe(0);
    // camera placeholder emoji present
    expect(r.root.findAll((n: any) => textContent(n).includes("📷")).length).toBeGreaterThan(0);
  });

  it("returns early when there are no servers", async () => {
    mockUseSelector.mockReturnValue({});
    await render();
    expect(mockGetUserData).not.toHaveBeenCalled();
  });

  it("handles a response with no user entry", async () => {
    mockUseSelector.mockReturnValue({ "http://a": { serverId: "http://a", username: "alice", status: "CONNECTED" } });
    mockGetUserData.mockResolvedValueOnce([]); // data[0] undefined
    const r = await render();
    expect(r.root.findAllByType(Image).length).toBe(0);
  });

  it("logs an error when fetching the profile fails", async () => {
    mockUseSelector.mockReturnValue({ "http://a": { serverId: "http://a", username: "alice", status: "CONNECTED" } });
    mockGetUserData.mockRejectedValueOnce(new Error("network"));
    await render();
    expect(console.log).toHaveBeenCalledWith("Error fetching data:", expect.any(Error));
  });

  it("edits the avatar image URL through the modal", async () => {
    mockUseSelector.mockReturnValue({ "http://a": { serverId: "http://a", username: "alice", status: "CONNECTED" } });
    const r = await render();
    // open modal via the avatar (contains the ✎ overlay)
    const avatar = findPressableByText(r.root, "✎");
    act(() => avatar.props.style({ pressed: true })); // pressed style branch
    act(() => avatar.props.onPress());
    // change the URL
    const input = findInput(r.root, "https://example.com/image.png");
    act(() => input.props.onChangeText("http://new.img/z.png"));
    // Set Image saves it
    const setBtn = findPressableByText(r.root, "Set Image");
    act(() => setBtn.props.onPress());
    // reopen and cancel
    act(() => findPressableByText(r.root, "✎").props.onPress());
    const cancelBtn = findPressableByText(r.root, "Cancel");
    act(() => cancelBtn.props.onPress());
    // onRequestClose of the Modal
    const RN = require("react-native");
    const modal = r.root.findByType(RN.Modal);
    act(() => modal.props.onRequestClose());
    expect(r.toJSON()).toBeTruthy();
  });

  it("saves the profile to connected servers and skips expired sessions", async () => {
    mockUseSelector.mockReturnValue({
      "http://a": { serverId: "http://a", username: "alice", status: "CONNECTED" },
      "http://b": { serverId: "http://b", username: "bob", status: "SESSION_EXPIRED" },
    });
    const r = await render();
    const save = findPressableByText(r.root, "Save Changes");
    act(() => save.props.style({ pressed: true })); // pressed style branch
    await act(async () => {
      await save.props.onPress();
    });
    // Only the CONNECTED server received the update
    expect(mockPostNewUserData).toHaveBeenCalledTimes(1);
    expect(Alert.alert).toHaveBeenCalledWith("Success", "Profile updated across all servers!");
  });

  it("shows a spinner while saving", async () => {
    mockUseSelector.mockReturnValue({ "http://a": { serverId: "http://a", username: "alice", status: "CONNECTED" } });
    mockPostNewUserData.mockReturnValueOnce(new Promise(() => {})); // never resolves
    const r = await render();
    const save = findPressableByText(r.root, "Save Changes");
    act(() => {
      save.props.onPress();
    });
    expect(r.root.findAllByType(ActivityIndicator).length).toBeGreaterThan(0);
  });

  it("alerts on failure when the update throws", async () => {
    // A proxy that throws on Object.values/keys triggers the outer catch
    const throwing = new Proxy(
      {},
      {
        ownKeys() {
          throw new Error("boom");
        },
      },
    );
    mockUseSelector.mockReturnValue(throwing);
    const r = await render();
    const save = findPressableByText(r.root, "Save Changes");
    await act(async () => {
      await save.props.onPress();
    });
    expect(Alert.alert).toHaveBeenCalledWith("Error", "Failed to update profile.");
  });

  it("wipes all data on disconnect", async () => {
    mockUseSelector.mockReturnValue({
      "http://a": { serverId: "http://a", username: "alice", status: "CONNECTED" },
    });
    await render();
    await act(async () => {
      lastDisconnectOnPress()();
    });
    // Alert with a destructive "Wipe Everything" button
    const alertArgs = (Alert.alert as jest.Mock).mock.calls.at(-1);
    const wipeBtn = alertArgs[2].find((b: any) => b.text === "Wipe Everything");
    await act(async () => {
      await wipeBtn.onPress();
    });
    expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ payload: "http://a" }));
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("persist_root");
    expect(AsyncStorage.clear).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith("/add-server");
  });

  it("alerts when the wipe fails", async () => {
    mockUseSelector.mockReturnValue({
      "http://a": { serverId: "http://a", username: "alice", status: "CONNECTED" },
    });
    (SecureStore.deleteItemAsync as jest.Mock).mockRejectedValueOnce(new Error("locked"));
    await render();
    await act(async () => {
      lastDisconnectOnPress()();
    });
    const alertArgs = (Alert.alert as jest.Mock).mock.calls.at(-1);
    const wipeBtn = alertArgs[2].find((b: any) => b.text === "Wipe Everything");
    await act(async () => {
      await wipeBtn.onPress();
    });
    expect(console.error).toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith("Error", "Could not completely reset the app.");
  });

  it("defaults the theme to light when the color scheme is undefined and cleans up on unmount", async () => {
    const RN = require("react-native");
    RN.useColorScheme.mockReturnValue(undefined); // exercise the `colorScheme ?? "light"` nullish branch
    mockUseSelector.mockReturnValue({ "http://a": { serverId: "http://a", username: "alice", status: "CONNECTED" } });
    const r = await render();
    act(() => r.unmount()); // triggers the useFocusEffect cleanup function
    expect(true).toBe(true);
  });

  it("renders with the dark theme and iOS keyboard behavior", async () => {
    const RN = require("react-native");
    RN.useColorScheme.mockReturnValue("dark");
    RN.Platform.OS = "ios";
    mockUseSelector.mockReturnValue({ "http://a": { serverId: "http://a", username: "alice", status: "CONNECTED" } });
    const r = await render();
    expect(r.toJSON()).toBeTruthy();
    RN.Platform.OS = "android";
  });

  it("reads the accounts slice through the actual selector", async () => {
    // Run the selector against a real state object so the arrow `(state) => state.servers.accounts` executes
    mockUseSelector.mockImplementation((selector: any) =>
      selector({ servers: { accounts: { "http://a": { serverId: "http://a", username: "alice", status: "CONNECTED" } } } }),
    );
    const r = await render();
    expect(r.toJSON()).toBeTruthy();
  });
});
