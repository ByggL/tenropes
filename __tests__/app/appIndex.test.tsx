import React from "react";
import { act, create } from "react-test-renderer";

// Mock expo-router Redirect so we can capture the href it renders
jest.mock("expo-router", () => ({
  Redirect: ({ href }: { href: string }) => {
    const { Text } = require("react-native");
    return <Text testID="redirect">{href}</Text>;
  },
}));

// Mock react-redux useSelector
const mockUseSelector = jest.fn();
jest.mock("react-redux", () => ({
  useSelector: (selector: any) => mockUseSelector(selector),
}));

import Index from "../../app/index";

function renderIndex() {
  let renderer: any;
  act(() => {
    renderer = create(<Index />);
  });
  return renderer;
}

describe("app/index.tsx", () => {
  afterEach(() => jest.clearAllMocks());

  it("redirects to /add-server when there are no servers", () => {
    mockUseSelector.mockReturnValue({});
    const tree = renderIndex().toJSON();
    expect(tree.children).toEqual(["/add-server"]);
  });

  it("redirects to channel selection when servers exist", () => {
    mockUseSelector.mockReturnValue({ "http://a": {} });
    const tree = renderIndex().toJSON();
    expect(tree.children).toEqual(["/(tabs)/channelSelectionPage"]);
  });

  it("falls back to empty accounts object when state slice is missing", () => {
    // Exercise the `|| {}` branch of the selector
    mockUseSelector.mockImplementation((selector: any) => selector({ servers: undefined }));
    const tree = renderIndex().toJSON();
    expect(tree.children).toEqual(["/add-server"]);
  });
});
