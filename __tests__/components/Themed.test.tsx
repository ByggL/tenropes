import React from "react";
import { act, create } from "react-test-renderer";
import * as RN from "react-native";
import { Text, View, useThemeColor } from "../../components/Themed";
import Colors from "@/constants/Colors";

function renderTree(element: React.ReactElement) {
  let r: any;
  act(() => {
    r = create(element);
  });
  return r;
}

// Probe component to read useThemeColor's return value directly
function Probe({ light, dark, name }: any) {
  const color = useThemeColor({ light, dark }, name);
  return <RN.Text>{color}</RN.Text>;
}

describe("components/Themed", () => {
  afterEach(() => jest.restoreAllMocks());

  it("falls back to the light theme color when scheme is null and no prop color is given", () => {
    jest.spyOn(RN, "useColorScheme").mockReturnValue(null); // exercises the `?? 'light'` branch
    const r = renderTree(<Probe name="text" />);
    expect(r.toJSON().children).toEqual([Colors.light.text]);
  });

  it("returns the prop color when provided (dark scheme)", () => {
    jest.spyOn(RN, "useColorScheme").mockReturnValue("dark");
    const r = renderTree(<Probe dark="#123456" name="text" />);
    expect(r.toJSON().children).toEqual(["#123456"]);
  });

  it("uses the dark theme color when no prop color is given", () => {
    jest.spyOn(RN, "useColorScheme").mockReturnValue("dark");
    const r = renderTree(<Probe name="background" />);
    expect(r.toJSON().children).toEqual([Colors.dark.background]);
  });

  it("renders themed Text and View", () => {
    jest.spyOn(RN, "useColorScheme").mockReturnValue("light");
    expect(renderTree(<Text lightColor="#fff">hi</Text>).toJSON()).toBeTruthy();
    expect(renderTree(<View darkColor="#000" />).toJSON()).toBeTruthy();
  });
});
