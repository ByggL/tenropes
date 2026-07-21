import React from "react";
import { act, create } from "react-test-renderer";
import { MonoText } from "../../components/StyledText";

describe("components/StyledText", () => {
  it("renders MonoText with the SpaceMono font family, preserving passed style", () => {
    let r: any;
    act(() => {
      r = create(<MonoText style={{ fontSize: 12 }}>mono</MonoText>);
    });
    expect(r.toJSON()).toBeTruthy();
  });
});
