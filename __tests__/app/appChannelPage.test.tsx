import React from "react";
import { act, create } from "react-test-renderer";
import { FlatList } from "react-native";

// --- expo-router ---
let focusCallback: any = null;
const mockParams = jest.fn();
jest.mock("expo-router", () => ({
  useLocalSearchParams: () => mockParams(),
  useFocusEffect: (cb: any) => {
    focusCallback = cb;
  },
}));

// --- hooks ---
const mockLoadOlderMessages = jest.fn();
const mockSendMessage = jest.fn().mockResolvedValue(undefined);
const mockUseChannelAdmin = jest.fn();
const mockUseChannelMessages = jest.fn();
jest.mock("@/hooks/useChannelAdmin", () => ({
  useChannelAdmin: (...args: any[]) => mockUseChannelAdmin(...args),
}));
jest.mock("@/hooks/useChannelMessages", () => ({
  useChannelMessages: (...args: any[]) => mockUseChannelMessages(...args),
}));

// --- child components (capture props) ---
let messageInputProps: any = null;
let messageItemProps: any = null;
jest.mock("@/components/chat/ChannelHeader", () => () => null);
jest.mock("@/components/chat/MessageInput", () => (props: any) => {
  messageInputProps = props;
  return null;
});
jest.mock("@/components/chat/MessageItem", () => (props: any) => {
  messageItemProps = props;
  return null;
});
jest.mock("@/components/chat/QrCodeModal", () => () => null);

// --- utils ---
const mockSetActiveChannel = jest.fn();
const mockOptimizeTheme = jest.fn((t: any) => ({ ...t, primary_color_dark: "#opt", primary_color: "#opt2" }));
jest.mock("@/utils/notifications", () => ({
  setActiveChannel: (...a: any[]) => mockSetActiveChannel(...a),
}));
jest.mock("@/utils/utils", () => ({
  optimizeThemeForReadability: (...a: any[]) => mockOptimizeTheme(...a),
}));

import ChatChannel from "../../app/(tabs)/channelPage";

const channelObj = {
  id: 42,
  name: "general",
  img: "",
  creatorId: 1,
  theme: { primary_color: "#111", primary_color_dark: "#000" },
  members: [],
};

function renderPage() {
  let renderer: any;
  act(() => {
    renderer = create(<ChatChannel />);
  });
  return renderer;
}

describe("app/(tabs)/channelPage.tsx", () => {
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    focusCallback = null;
    messageInputProps = null;
    messageItemProps = null;
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    mockUseChannelAdmin.mockReturnValue({
      isAdmin: true,
      isSharing: false,
      isQrModalVisible: false,
      setQrModalVisible: jest.fn(),
      qrInviteLink: "",
      isLoadingQr: false,
      handleShowQrCode: jest.fn(),
      handleShareInvite: jest.fn(),
    });
    mockUseChannelMessages.mockReturnValue({
      messages: [{ id: 7 }, { id: 8 }],
      isFetchingHistory: false,
      loadOlderMessages: mockLoadOlderMessages,
      sendMessage: mockSendMessage,
    });
  });

  afterEach(() => logSpy.mockRestore());

  it("renders the placeholder and short-circuits the focus effect when no channel param", () => {
    mockParams.mockReturnValue({ serverUrl: "http://s" });
    const r = renderPage();
    // Placeholder branch renders (no SafeAreaView / MessageInput captured)
    expect(messageInputProps).toBeNull();
    // Focus effect callback returns early (no setActiveChannel)
    act(() => {
      const cleanup = focusCallback();
      expect(cleanup).toBeUndefined();
    });
    expect(mockSetActiveChannel).not.toHaveBeenCalled();
    expect(r.toJSON()).toBeTruthy();
  });

  it("renders the chat when a channel with theme is provided, using optimizeThemeForReadability", () => {
    mockParams.mockReturnValue({ channel: JSON.stringify(channelObj), serverUrl: "http://s" });
    const r = renderPage();
    expect(mockOptimizeTheme).toHaveBeenCalledWith(channelObj.theme);
    expect(messageInputProps).not.toBeNull();

    // Focus effect: sets the active channel, cleanup clears it
    let cleanup: any;
    act(() => {
      cleanup = focusCallback();
    });
    expect(mockSetActiveChannel).toHaveBeenCalledWith("42");
    act(() => cleanup());
    expect(mockSetActiveChannel).toHaveBeenCalledWith(null);

    // FlatList arrows: keyExtractor, renderItem, onEndReached
    const list = r.root.findAllByType(FlatList)[0];
    expect(list.props.keyExtractor({ id: 99 })).toBe("99");
    const element = list.props.renderItem({ item: { id: 7 }, index: 0 });
    expect(element.props.item).toEqual({ id: 7 });
    list.props.onEndReached();
    expect(mockLoadOlderMessages).toHaveBeenCalled();
  });

  it("falls back to a default theme when the channel has no theme", () => {
    const noTheme = { ...channelObj, theme: undefined };
    mockParams.mockReturnValue({ channel: JSON.stringify(noTheme), serverUrl: "http://s" });
    renderPage();
    expect(mockOptimizeTheme).not.toHaveBeenCalled();
    expect(messageInputProps).not.toBeNull();
  });

  describe("onSendPress (handleSend prop)", () => {
    beforeEach(() => {
      mockParams.mockReturnValue({ channel: JSON.stringify(channelObj), serverUrl: "http://s" });
    });

    it("sends the overload text and returns early", async () => {
      renderPage();
      await act(async () => {
        await messageInputProps.handleSend(undefined, "override text");
      });
      expect(logSpy).toHaveBeenCalledWith("no image file");
      expect(mockSendMessage).toHaveBeenCalledWith("override text");
      expect(mockSendMessage).toHaveBeenCalledTimes(1);
    });

    it("sends inputText with an image file when no overload is given", async () => {
      renderPage();
      await act(async () => {
        await messageInputProps.handleSend("blob-image", "");
      });
      expect(logSpy).toHaveBeenCalledWith("there is an image file dammit");
      expect(mockSendMessage).toHaveBeenCalledWith("", "blob-image");
    });

    it("sends inputText with no image and no overload", async () => {
      renderPage();
      await act(async () => {
        await messageInputProps.handleSend();
      });
      expect(logSpy).toHaveBeenCalledWith("no image file");
      expect(mockSendMessage).toHaveBeenCalledWith("", undefined);
    });
  });
});
