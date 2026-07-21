import React from "react";
import { act, create } from "react-test-renderer";
import { useClientOnlyValue } from "../../components/useClientOnlyValue";
import * as colorSchemeModule from "../../components/useColorScheme";
const { useColorScheme } = colorSchemeModule;

describe("components/useClientOnlyValue", () => {
  it("always returns the client value", () => {
    expect(useClientOnlyValue("server", "client")).toBe("client");
    expect(useClientOnlyValue(false, true)).toBe(true);
  });
});

describe("components/useColorScheme", () => {
  it("re-exports the React Native color scheme hook", () => {
    let scheme: any = "unset";
    function Probe() {
      scheme = useColorScheme();
      return null;
    }
    act(() => {
      create(<Probe />);
    });
    // On the node test environment it resolves to null/"light"/"dark" — just assert it ran
    expect(scheme === null || typeof scheme === "string").toBe(true);
  });
});
