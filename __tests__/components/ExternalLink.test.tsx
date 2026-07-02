import React from "react";
import { act, create } from "react-test-renderer";
import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { ExternalLink } from "../../components/ExternalLink";

// Render Link as a simple element that surfaces the onPress prop
jest.mock("expo-router", () => ({
  Link: (props: any) => {
    const { Text } = require("react-native");
    return <Text {...props} />;
  },
}));

jest.mock("expo-web-browser", () => ({
  openBrowserAsync: jest.fn(),
}));

function render(el: React.ReactElement) {
  let r: any;
  act(() => {
    r = create(el);
  });
  return r;
}

function getLink(r: any) {
  return r.root.findAll((n: any) => n.props && typeof n.props.onPress === "function")[0];
}

describe("components/ExternalLink", () => {
  afterEach(() => jest.clearAllMocks());

  it("opens an in-app browser and prevents default on native", () => {
    Platform.OS = "ios";
    const r = render(<ExternalLink href="https://example.com">go</ExternalLink>);
    const e = { preventDefault: jest.fn() };
    act(() => getLink(r).props.onPress(e));
    expect(e.preventDefault).toHaveBeenCalled();
    expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith("https://example.com");
  });

  it("keeps the default anchor behavior on web", () => {
    Platform.OS = "web";
    const r = render(<ExternalLink href="https://example.com">go</ExternalLink>);
    const e = { preventDefault: jest.fn() };
    act(() => getLink(r).props.onPress(e));
    expect(e.preventDefault).not.toHaveBeenCalled();
    expect(WebBrowser.openBrowserAsync).not.toHaveBeenCalled();
    Platform.OS = "android";
  });
});
