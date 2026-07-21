import React from "react";
import { act, create } from "react-test-renderer";
import { Image, TextInput, TouchableOpacity } from "react-native";

const mockOptimizeTheme = jest.fn((t: any) => t);
jest.mock("@/utils/utils", () => ({
  optimizeThemeForReadability: (...a: any[]) => mockOptimizeTheme(...a),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const mockLaunchLibrary = jest.fn();
jest.mock("expo-image-picker", () => ({
  launchImageLibraryAsync: (...a: any[]) => mockLaunchLibrary(...a),
}));

// Capture the GIF picker props so we can drive onSelect / onClose
let gifPickerProps: any = null;
jest.mock("@/components/chat/GifPickerModal", () => (props: any) => {
  gifPickerProps = props;
  return null;
});

import MessageInput from "@/components/chat/MessageInput";

const channel: any = { name: "general", theme: { primary_color: "#111", primary_color_dark: "#000", accent_color: "#0ff", text_color: "#222", accent_text_color: "#fff" } };

function getPressables(root: any) {
  return root.findAllByType(TouchableOpacity);
}

function render(over: any = {}) {
  const handleSend = jest.fn();
  const setInputText = jest.fn();
  let r: any;
  act(() => {
    r = create(<MessageInput channel={over.channel ?? channel} inputText={over.inputText ?? ""} setInputText={setInputText} handleSend={handleSend} />);
  });
  return { r, handleSend, setInputText };
}

describe("components/chat/MessageInput.tsx", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    gifPickerProps = null;
    mockOptimizeTheme.mockImplementation((t: any) => t);
    jest.spyOn(console, "log").mockImplementation(() => {});
  });
  afterEach(() => {
    const RN = require("react-native");
    RN.Platform.OS = "android";
  });

  it("typing updates the parent input state", () => {
    const { r, setInputText } = render();
    const input = r.root.findAllByType(TextInput)[0];
    act(() => input.props.onChangeText("hi"));
    expect(setInputText).toHaveBeenCalledWith("hi");
  });

  it("send button (and submit) forwards no image when none is selected", () => {
    const { r, handleSend } = render();
    const input = r.root.findAllByType(TextInput)[0];
    act(() => input.props.onSubmitEditing());
    expect(handleSend).toHaveBeenCalledWith(undefined);
    // send button is the last TouchableOpacity
    const send = getPressables(r.root).slice(-1)[0];
    act(() => send.props.onPress());
    expect(handleSend).toHaveBeenCalledTimes(2);
  });

  it("picks an image, shows the preview, sends its base64, then removes it", async () => {
    mockLaunchLibrary.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: "file://pic.png", base64: "BASE64DATA", fileName: "pic.png" }],
    });
    const { r, handleSend } = render();
    const [attach] = getPressables(r.root); // first TouchableOpacity = "+"
    await act(async () => {
      await attach.props.onPress();
    });
    // preview Image now rendered
    expect(r.root.findAllByType(Image).length).toBe(1);
    // send -> base64 forwarded
    const send = getPressables(r.root).slice(-1)[0];
    act(() => send.props.onPress());
    expect(handleSend).toHaveBeenCalledWith("BASE64DATA");
    // after send the image is cleared -> preview gone
    expect(r.root.findAllByType(Image).length).toBe(0);
  });

  it("removes the selected image via the ✕ button", async () => {
    mockLaunchLibrary.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: "file://pic.png", base64: "B", fileName: "pic.png" }],
    });
    const { r } = render();
    await act(async () => {
      await getPressables(r.root)[0].props.onPress();
    });
    expect(r.root.findAllByType(Image).length).toBe(1);
    // remove button is the TouchableOpacity inside the preview (first now)
    const remove = getPressables(r.root)[0];
    act(() => remove.props.onPress());
    expect(r.root.findAllByType(Image).length).toBe(0);
  });

  it("does nothing when image picking is canceled", async () => {
    mockLaunchLibrary.mockResolvedValueOnce({ canceled: true });
    const { r } = render();
    await act(async () => {
      await getPressables(r.root)[0].props.onPress();
    });
    expect(r.root.findAllByType(Image).length).toBe(0);
  });

  it("opens the GIF picker and forwards a selected gif url, then closes", () => {
    const { r, handleSend } = render();
    // GIF button is the 2nd TouchableOpacity
    const gifBtn = getPressables(r.root)[1];
    act(() => gifBtn.props.onPress());
    expect(gifPickerProps.visible).toBe(true);
    // select a gif with a url
    act(() => gifPickerProps.onSelect({ file: { md: { gif: { url: "http://gif/x.gif" } } } }));
    expect(handleSend).toHaveBeenCalledWith(undefined, "http://gif/x.gif");
    // select a gif WITHOUT a url -> no additional send
    act(() => gifPickerProps.onSelect({ file: {} }));
    expect(handleSend).toHaveBeenCalledTimes(1);
    // onClose handler
    act(() => gifPickerProps.onClose());
    expect(gifPickerProps.visible).toBe(false);
  });

  it("falls back to the default theme when the channel has no theme", () => {
    const { r } = render({ channel: { name: "x" } });
    expect(mockOptimizeTheme).not.toHaveBeenCalled();
    expect(r.toJSON()).toBeTruthy();
  });

  it("uses iOS keyboard behavior when on iOS", () => {
    const RN = require("react-native");
    RN.Platform.OS = "ios";
    const { r } = render();
    expect(r.toJSON()).toBeTruthy();
  });
});
