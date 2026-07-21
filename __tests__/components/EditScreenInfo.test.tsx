import React from "react";
import { act, create } from "react-test-renderer";
import EditScreenInfo from "../../components/EditScreenInfo";

jest.mock("expo-router", () => ({
  Link: (props: any) => {
    const { Text } = require("react-native");
    return <Text {...props} />;
  },
}));
jest.mock("expo-web-browser", () => ({ openBrowserAsync: jest.fn() }));

describe("components/EditScreenInfo", () => {
  it("renders the screen info with the given path", () => {
    let r: any;
    act(() => {
      r = create(<EditScreenInfo path="app/index.tsx" />);
    });
    expect(r.toJSON()).toBeTruthy();
  });
});
