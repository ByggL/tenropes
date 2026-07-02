import React from "react";
import { act, create } from "react-test-renderer";

// expo-router primitives used by these static screens
jest.mock("expo-router", () => {
  const { Text } = require("react-native");
  const Link = ({ children }: any) => <Text>{children}</Text>;
  const Stack = { Screen: (_props: any) => null };
  return { Link, Stack };
});

jest.mock("expo-router/html", () => ({
  ScrollViewStyleReset: () => null,
}));

// EditScreenInfo pulls in ExternalLink/expo-web-browser; stub it to keep the test focused on modal.tsx
jest.mock("@/components/EditScreenInfo", () => () => null);

import ModalScreen from "../../app/modal";
import NotFoundScreen from "../../app/+not-found";
import Root from "../../app/+html";

function renderTree(element: React.ReactElement) {
  let renderer: any;
  act(() => {
    renderer = create(element);
  });
  return renderer.toJSON();
}

describe("static screens", () => {
  it("renders the modal screen (non-ios status bar branch)", () => {
    const { Platform } = require("react-native");
    Platform.OS = "android";
    expect(renderTree(<ModalScreen />)).toBeTruthy();
  });

  it("renders the modal screen (ios status bar branch)", () => {
    const { Platform } = require("react-native");
    Platform.OS = "ios";
    expect(renderTree(<ModalScreen />)).toBeTruthy();
    Platform.OS = "android";
  });

  it("renders the not-found screen", () => {
    expect(renderTree(<NotFoundScreen />)).toBeTruthy();
  });

  it("renders the +html root wrapper with children", () => {
    const { Text } = require("react-native");
    const tree = renderTree(<Root><Text>content</Text></Root>);
    expect(tree).toBeTruthy();
  });
});
