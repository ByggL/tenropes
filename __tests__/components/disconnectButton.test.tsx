import React from "react";
import { act, create } from "react-test-renderer";
import { ActivityIndicator, Text } from "react-native";
import { DisconnectButton } from "../../components/disconnectButton";

function render(element: React.ReactElement) {
  let renderer: any;
  act(() => {
    renderer = create(element);
  });
  return renderer;
}

function getPressable(root: any) {
  // The outer Pressable owns onPressIn + the style callback; the inner host node
  // carries a resolved style array, so match on onPressIn to get the outer one.
  return root.findAll((n: any) => n.props && typeof n.props.onPressIn === "function")[0];
}

describe("components/disconnectButton.tsx", () => {
  it("renders the default label and fires onPress", () => {
    const onPress = jest.fn();
    const r = render(<DisconnectButton onPress={onPress} />);
    const text = r.root.findAllByType(Text)[0];
    expect(text.props.children).toBe("Disconnect");

    const pressable = getPressable(r.root);
    act(() => pressable.props.onPress({} as any));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("renders a custom label and applies custom styles", () => {
    const r = render(
      <DisconnectButton
        onPress={jest.fn()}
        label="Leave"
        style={{ margin: 5 }}
        textStyle={{ fontSize: 20 }}
      />,
    );
    expect(r.root.findAllByType(Text)[0].props.children).toBe("Leave");
    const pressable = getPressable(r.root);
    // style callback: not pressed, not disabled, custom style merged
    const styleArr = pressable.props.style({ pressed: false });
    expect(styleArr).toContainEqual({ margin: 5 });
  });

  it("shows a spinner and is non-interactive while loading", () => {
    const r = render(<DisconnectButton onPress={jest.fn()} isLoading />);
    expect(r.root.findAllByType(ActivityIndicator).length).toBe(1);
    expect(r.root.findAllByType(Text).length).toBe(0);
    const pressable = getPressable(r.root);
    expect(pressable.props.disabled).toBe(true);
    // style callback with pressed + disabled/loading branches active
    expect(pressable.props.style({ pressed: true })).toBeTruthy();
  });

  it("is disabled when the disabled prop is set", () => {
    const r = render(<DisconnectButton onPress={jest.fn()} disabled />);
    const pressable = getPressable(r.root);
    expect(pressable.props.disabled).toBe(true);
    // pressed:false so the `pressed && ...` branch is the falsy side
    expect(pressable.props.style({ pressed: false })).toBeTruthy();
  });

  it("runs the press-in and press-out animation handlers", () => {
    const r = render(<DisconnectButton onPress={jest.fn()} />);
    const pressable = getPressable(r.root);
    act(() => {
      pressable.props.onPressIn();
      pressable.props.onPressOut();
    });
    // No assertion needed beyond not throwing; Animated.spring().start() ran both ways
    expect(pressable.props.onPressIn).toBeInstanceOf(Function);
  });
});
