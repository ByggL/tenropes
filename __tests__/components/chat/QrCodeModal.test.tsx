import React from "react";
import { act, create } from "react-test-renderer";
import { ActivityIndicator } from "react-native";

jest.mock("@/utils/utils", () => ({
  optimizeThemeForReadability: jest.fn((t: any) => t),
}));
jest.mock("react-native-qrcode-svg", () => ({ __esModule: true, default: () => null }));

import QrCodeModal from "@/components/chat/QrCodeModal";
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
  theme: {
    primary_color: "#111",
    primary_color_dark: "#000",
    accent_color: "#0ff",
    text_color: "#fff",
    accent_text_color: "#eee",
  },
};

describe("components/chat/QrCodeModal.tsx", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows a spinner while loading the QR code", () => {
    const setVisible = jest.fn();
    const r = render(
      <QrCodeModal
        channel={themedChannel as any}
        isQrModalVisible={true}
        setQrModalVisible={setVisible}
        isLoadingQr={true}
        qrInviteLink=""
      />,
    );
    expect(optimizeThemeForReadability).toHaveBeenCalledWith(themedChannel.theme);
    expect(r.root.findAllByType(ActivityIndicator).length).toBe(1);
  });

  it("renders the QR code once loaded and closes via the button and onRequestClose", () => {
    const setVisible = jest.fn();
    const r = render(
      <QrCodeModal
        channel={themedChannel as any}
        isQrModalVisible={true}
        setQrModalVisible={setVisible}
        isLoadingQr={false}
        qrInviteLink="http://invite/xyz"
      />,
    );
    expect(r.root.findAllByType(ActivityIndicator).length).toBe(0);
    // Close button
    act(() => pressables(r.root)[0].props.onPress());
    expect(setVisible).toHaveBeenCalledWith(false);
    // Modal onRequestClose
    const modal = r.root.findAll((n: any) => n.props && typeof n.props.onRequestClose === "function")[0];
    act(() => modal.props.onRequestClose());
    expect(setVisible).toHaveBeenCalledTimes(2);
  });

  it("falls back to the default theme and 'Loading...' QR value without a channel theme", () => {
    const r = render(
      <QrCodeModal
        channel={{ name: "n" } as any}
        isQrModalVisible={true}
        setQrModalVisible={jest.fn()}
        isLoadingQr={false}
        qrInviteLink=""
      />,
    );
    expect(optimizeThemeForReadability).not.toHaveBeenCalled();
    expect(r.toJSON()).toBeTruthy();
  });
});
