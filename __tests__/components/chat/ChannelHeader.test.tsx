import React from "react";
import { act, create } from "react-test-renderer";
import { ActivityIndicator } from "react-native";

const mockReplace = jest.fn();
jest.mock("expo-router", () => ({ useRouter: () => ({ replace: mockReplace }) }));
jest.mock("@/utils/utils", () => ({
  optimizeThemeForReadability: jest.fn((t: any) => t),
}));
jest.mock("@expo/vector-icons", () => ({ FontAwesome: () => null }));

import ChannelHeader from "@/components/chat/ChannelHeader";
import { optimizeThemeForReadability } from "@/utils/utils";

function render(el: React.ReactElement) {
  let r: any;
  act(() => {
    r = create(el);
  });
  return r;
}
function pressables(root: any) {
  return root.findAll((n: any) => n.props && typeof n.props.onPress === "function");
}

const themedChannel = {
  name: "general",
  img: "http://img/a.png",
  theme: {
    primary_color: "#111",
    primary_color_dark: "#000",
    accent_color: "#0ff",
    text_color: "#fff",
    accent_text_color: "#eee",
  },
};

describe("components/chat/ChannelHeader.tsx", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders admin controls and wires the back / QR / share actions", () => {
    const handleShowQrCode = jest.fn();
    const handleShareInvite = jest.fn();
    const r = render(
      <ChannelHeader
        channel={themedChannel as any}
        isAdmin={true}
        handleShowQrCode={handleShowQrCode}
        handleShareInvite={handleShareInvite}
        isSharing={false}
      />,
    );
    expect(optimizeThemeForReadability).toHaveBeenCalledWith(themedChannel.theme);
    // Match handlers by reference (TouchableOpacity nests onPress across instances)
    const back = r.root.findAll(
      (n: any) => typeof n.props?.onPress === "function" && n.props.onPress !== handleShowQrCode && n.props.onPress !== handleShareInvite,
    )[0];
    act(() => back.props.onPress());
    expect(mockReplace).toHaveBeenCalledWith("/(tabs)/channelSelectionPage");
    const qr = r.root.findAll((n: any) => n.props?.onPress === handleShowQrCode)[0];
    act(() => qr.props.onPress());
    expect(handleShowQrCode).toHaveBeenCalled();
    const share = r.root.findAll((n: any) => n.props?.onPress === handleShareInvite)[0];
    act(() => share.props.onPress());
    expect(handleShareInvite).toHaveBeenCalled();
  });

  it("shows a spinner on the share button while sharing", () => {
    const r = render(
      <ChannelHeader
        channel={themedChannel as any}
        isAdmin={true}
        handleShowQrCode={jest.fn()}
        handleShareInvite={jest.fn()}
        isSharing={true}
      />,
    );
    expect(r.root.findAllByType(ActivityIndicator).length).toBe(1);
  });

  it("hides admin controls when not admin and falls back to the default theme without a channel theme", () => {
    const r = render(
      <ChannelHeader
        channel={{ name: "n", img: "http://x/y.png" } as any}
        isAdmin={false}
        handleShowQrCode={jest.fn()}
        handleShareInvite={jest.fn()}
        isSharing={false}
      />,
    );
    // Only the back button has an onPress (no QR/share buttons)
    expect(pressables(r.root).length).toBe(1);
    // Fallback theme means optimizeThemeForReadability is NOT called
    expect(optimizeThemeForReadability).not.toHaveBeenCalled();
  });
});
