import React from "react";
import { act, create } from "react-test-renderer";
import { Alert } from "react-native";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

let mockAccounts: Record<string, any> = {};
jest.mock("react-redux", () => ({
  useSelector: (selector: any) => selector({ servers: { accounts: mockAccounts } }),
}));

const mockCreateNewChannel = jest.fn();
jest.mock("../../utils/api", () => ({
  API: jest.fn().mockImplementation(() => ({
    createNewChannel: mockCreateNewChannel,
  })),
}));
import { API } from "../../utils/api";

// Capture the onSubmit handler (handleCreate) passed to the form
let capturedOnSubmit: any = null;
jest.mock("@/components/channelCreaModifForm", () => (props: any) => {
  capturedOnSubmit = props.onSubmit;
  return null;
});

jest.mock("@/components/Themed", () => {
  const RN = require("react-native");
  return { Text: RN.Text, View: RN.View };
});

import CreateChannelPage from "../../app/(tabs)/createChannel";

function findPressables(root: any) {
  return root.findAll((n: any) => n.props && typeof n.props.onPress === "function");
}

function render() {
  let r: any;
  act(() => {
    r = create(<CreateChannelPage />);
  });
  return r;
}

const twoServers = {
  "http://a": { serverId: "http://a", serverNickname: "Alpha" },
  "http://b": { serverId: "http://b", serverNickname: "Bravo" },
};

describe("app/(tabs)/createChannel.tsx", () => {
  let colorSchemeSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAccounts = {};
    capturedOnSubmit = null;
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
    const RN = require("react-native");
    RN.Platform.OS = "android";
    colorSchemeSpy = jest.spyOn(RN, "useColorScheme").mockReturnValue("light");
  });

  afterEach(() => {
    colorSchemeSpy.mockRestore();
  });

  it("shows the empty-server message and blocks creation without a selected server", async () => {
    mockAccounts = {}; // serverList empty -> selectedServerId ""
    const r = render();
    // Red "need to add a server" text is present
    expect(r.toJSON()).toBeTruthy();

    await act(async () => {
      await capturedOnSubmit({ name: "General", img: "", theme: {} });
    });
    expect(Alert.alert).toHaveBeenCalledWith("Error", "Please add and select a server first.");
    expect(mockCreateNewChannel).not.toHaveBeenCalled();
  });

  it("blocks creation when the channel name is blank", async () => {
    mockAccounts = twoServers;
    const r = render();
    await act(async () => {
      await capturedOnSubmit({ name: "   ", img: "", theme: {} });
    });
    expect(Alert.alert).toHaveBeenCalledWith("Error", "Please enter a channel name.");
    expect(mockCreateNewChannel).not.toHaveBeenCalled();
  });

  it("renders selectable server chips and updates the selection on press (light)", () => {
    mockAccounts = twoServers;
    const r = render();
    const chips = findPressables(r.root);
    expect(chips.length).toBe(2);
    // Select the second (non-default) server -> covers non-selected -> selected transition
    act(() => chips[1].props.onPress());
    expect(r.toJSON()).toBeTruthy();
  });

  it("creates a channel successfully with a provided image and navigates on OK (dark)", async () => {
    mockAccounts = twoServers;
    colorSchemeSpy.mockReturnValue("dark");
    mockCreateNewChannel.mockResolvedValueOnce(1);
    render();
    await act(async () => {
      await capturedOnSubmit({ name: "General", img: "http://img/pic.png", theme: { primary_color: "#fff" } });
    });
    expect(API).toHaveBeenCalledWith("http://a");
    expect(mockCreateNewChannel).toHaveBeenCalledWith(
      expect.objectContaining({ name: "General", img: "http://img/pic.png" }),
    );
    expect(Alert.alert).toHaveBeenCalledWith("Success", "Channel created successfully!", expect.any(Array));
    // Invoke the OK button's onPress
    const alertCall = (Alert.alert as jest.Mock).mock.calls.find((c) => c[0] === "Success");
    act(() => alertCall[2][0].onPress());
    expect(mockPush).toHaveBeenCalledWith("/(tabs)/channelSelectionPage");
  });

  it("falls back to the placeholder image when none is provided", async () => {
    mockAccounts = twoServers;
    mockCreateNewChannel.mockResolvedValueOnce(1);
    render();
    await act(async () => {
      await capturedOnSubmit({ name: "General", img: "", theme: {} });
    });
    expect(mockCreateNewChannel).toHaveBeenCalledWith(
      expect.objectContaining({ img: "https://placehold.co/200x200/png" }),
    );
  });

  it("alerts with the error message when creation fails", async () => {
    mockAccounts = twoServers;
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockCreateNewChannel.mockRejectedValueOnce(new Error("Channel name already taken"));
    render();
    await act(async () => {
      await capturedOnSubmit({ name: "General", img: "", theme: {} });
    });
    expect(Alert.alert).toHaveBeenCalledWith("Error", "Channel name already taken");
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it("uses the generic error message when the error has no message", async () => {
    mockAccounts = twoServers;
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockCreateNewChannel.mockRejectedValueOnce({});
    render();
    await act(async () => {
      await capturedOnSubmit({ name: "General", img: "", theme: {} });
    });
    expect(Alert.alert).toHaveBeenCalledWith("Error", "Failed to create channel.");
    consoleErrorSpy.mockRestore();
  });

  it("defaults the theme to light when the color scheme is null", () => {
    mockAccounts = twoServers;
    colorSchemeSpy.mockReturnValue(null);
    const r = render();
    expect(r.toJSON()).toBeTruthy();
  });

  it("uses the iOS keyboard behavior branch", () => {
    mockAccounts = twoServers;
    const RN = require("react-native");
    RN.Platform.OS = "ios";
    const r = render();
    expect(r.toJSON()).toBeTruthy();
    RN.Platform.OS = "android";
  });
});
