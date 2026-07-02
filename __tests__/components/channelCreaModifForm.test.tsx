import React from "react";
import { act, create } from "react-test-renderer";
import { Text, TextInput } from "react-native";

// reanimated: runOnJS should call the wrapped fn synchronously in tests
jest.mock("react-native-reanimated", () => ({ runOnJS: (fn: any) => fn }));

// Capture the ColorPicker's onComplete callback so we can drive color selection.
const mockPicker: { onComplete: any } = { onComplete: null };
jest.mock("reanimated-color-picker", () => ({
  __esModule: true,
  default: ({ onComplete, children }: any) => {
    mockPicker.onComplete = onComplete;
    return children;
  },
  HueSlider: () => null,
  Panel1: () => null,
  PreviewText: () => null,
  Swatches: () => null,
}));

// Force the color-picker Modal to always mount its children so ColorPicker's
// onComplete is captured even while the picker is closed (covers the
// activeColorKey === null branch of updateColorState).
jest.mock("react-native/Libraries/Modal/Modal", () => {
  const ReactLocal = require("react");
  const Passthrough = (props: any) => ReactLocal.createElement(ReactLocal.Fragment, null, props.children);
  return { __esModule: true, default: Passthrough };
});

import ChannelForm from "../../components/channelCreaModifForm";

// ---- helpers ----
function pressables(root: any) {
  return root.findAll((n: any) => n.props && typeof n.props.onPress === "function");
}
function textOf(node: any): string {
  return node
    .findAll((x: any) => x.type === Text)
    .map((t: any) => (Array.isArray(t.props.children) ? t.props.children.join("") : String(t.props.children ?? "")))
    .join("|");
}
function byText(root: any, substr: string) {
  return pressables(root).find((p: any) => textOf(p).includes(substr));
}
function presetButtons(root: any) {
  return pressables(root).filter((p: any) => textOf(p) === "");
}
function colorPreviews(root: any) {
  return pressables(root).filter((p: any) => textOf(p).includes("✎"));
}
function inputByPlaceholder(root: any, ph: string) {
  return root.findAll((n: any) => n.type === TextInput && n.props.placeholder === ph)[0];
}

function render(props: any) {
  let r: any;
  act(() => {
    r = create(<ChannelForm {...props} />);
  });
  return r;
}

const baseProps = () => ({ onSubmit: jest.fn().mockResolvedValue(undefined), submitLabel: "Save" });

const initialData = {
  name: "existing",
  img: "http://img/x.png",
  theme: {
    primary_color: "#111111",
    primary_color_dark: "#000000",
    accent_color: "#222222",
    text_color: "#333333",
    accent_text_color: "#444444",
  },
};

describe("components/channelCreaModifForm.tsx", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPicker.onComplete = null;
    const RN = require("react-native");
    jest.spyOn(RN.LayoutAnimation, "configureNext").mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  it("renders defaults (no initialData) and edits name/image", () => {
    const props = baseProps();
    const r = render(props);
    act(() => inputByPlaceholder(r.root, "# general").props.onChangeText("my-channel"));
    act(() => inputByPlaceholder(r.root, "https://example.com/logo.png").props.onChangeText("http://a/b.png"));
    expect(inputByPlaceholder(r.root, "# general").props.value).toBe("my-channel");
    expect(inputByPlaceholder(r.root, "https://example.com/logo.png").props.value).toBe("http://a/b.png");
  });

  it("selects a preset theme", () => {
    const r = render(baseProps());
    const presets = presetButtons(r.root);
    expect(presets.length).toBe(4);
    // Press a non-active preset (index 1 = Ocean Blue) to run handlePresetSelect
    act(() => presets[1].props.onPress());
    expect(r.toJSON()).toBeTruthy();
  });

  it("toggles the advanced color section and edits a color field manually", () => {
    const r = render(baseProps());
    const toggle = byText(r.root, "Edit Specific Colors");
    act(() => toggle.props.onPress());
    // Now advanced inputs (one per theme key = 5) are shown
    const colorInputs = r.root.findAll((n: any) => n.type === TextInput);
    // 2 top inputs + 5 color inputs
    expect(colorInputs.length).toBe(7);
    act(() => colorInputs[2].props.onChangeText("#ABCDEF"));
    // toggle label flips
    expect(byText(r.root, "Hide Color Options")).toBeTruthy();
    // collapse again
    act(() => byText(r.root, "Hide Color Options").props.onPress());
    expect(byText(r.root, "Edit Specific Colors")).toBeTruthy();
  });

  it("opens the picker, selects a color, and closes it", () => {
    const r = render(baseProps());
    // Modal is a passthrough here, so onComplete is captured immediately.
    // Selecting before any key is active exercises the no-op branch.
    act(() => mockPicker.onComplete({ hex: "#999999" }));
    // Open advanced + picker
    act(() => byText(r.root, "Edit Specific Colors").props.onPress());
    const previews = colorPreviews(r.root);
    expect(previews.length).toBe(5);
    act(() => previews[0].props.onPress()); // openPicker -> pickerVisible + activeColorKey
    // Picker is now mounted; selecting a color updates theme (activeColorKey set)
    act(() => mockPicker.onComplete({ hex: "#ABCDEF" }));
    // Close the picker via Done
    act(() => byText(r.root, "Done").props.onPress());
    expect(r.toJSON()).toBeTruthy();
  });

  it("submits and resets fields when there is no initialData", () => {
    const props = baseProps();
    const r = render(props);
    act(() => inputByPlaceholder(r.root, "# general").props.onChangeText("temp"));
    act(() => byText(r.root, "Save").props.onPress());
    expect(props.onSubmit).toHaveBeenCalledWith({
      name: "temp",
      img: "",
      theme: expect.objectContaining({ primary_color: "#E91E63" }),
    });
    // reset happened
    expect(inputByPlaceholder(r.root, "# general").props.value).toBe("");
  });

  it("submits without resetting when initialData is provided, and renders a Cancel button", () => {
    const props = { ...baseProps(), initialData, onCancel: jest.fn() };
    const r = render(props);
    expect(inputByPlaceholder(r.root, "# general").props.value).toBe("existing");
    act(() => byText(r.root, "Save").props.onPress());
    expect(props.onSubmit).toHaveBeenCalledWith({
      name: "existing",
      img: "http://img/x.png",
      theme: initialData.theme,
    });
    // no reset -> value unchanged
    expect(inputByPlaceholder(r.root, "# general").props.value).toBe("existing");
    // Cancel button works
    act(() => byText(r.root, "Cancel").props.onPress());
    expect(props.onCancel).toHaveBeenCalled();
  });

  it("shows a spinner instead of the label while loading", () => {
    const { ActivityIndicator } = require("react-native");
    const r = render({ ...baseProps(), loading: true });
    expect(r.root.findAllByType(ActivityIndicator).length).toBeGreaterThan(0);
  });

  it("renders with the dark color scheme", () => {
    const RN = require("react-native");
    const spy = jest.spyOn(RN, "useColorScheme").mockReturnValue("dark");
    const r = render(baseProps());
    expect(r.toJSON()).toBeTruthy();
    spy.mockRestore();
  });

  it("falls back to the light theme when the color scheme is null", () => {
    const RN = require("react-native");
    const spy = jest.spyOn(RN, "useColorScheme").mockReturnValue(null);
    const r = render(baseProps());
    expect(r.toJSON()).toBeTruthy();
    spy.mockRestore();
  });
});

// Module-level LayoutAnimation setup (line 23) needs fresh module evaluation per platform.
describe("channelCreaModifForm module init", () => {
  afterEach(() => {
    const RN = require("react-native");
    RN.Platform.OS = "ios";
    jest.resetModules();
  });

  it("enables LayoutAnimation experimental flag on android", () => {
    const spy = jest.fn();
    jest.isolateModules(() => {
      const RN = require("react-native");
      RN.Platform.OS = "android";
      RN.UIManager.setLayoutAnimationEnabledExperimental = spy;
      require("../../components/channelCreaModifForm");
    });
    expect(spy).toHaveBeenCalledWith(true);
  });

  it("does not enable it when the setter is unavailable on android", () => {
    expect(() =>
      jest.isolateModules(() => {
        const RN = require("react-native");
        RN.Platform.OS = "android";
        RN.UIManager.setLayoutAnimationEnabledExperimental = undefined;
        require("../../components/channelCreaModifForm");
      }),
    ).not.toThrow();
  });

  it("skips the setup on ios", () => {
    const spy = jest.fn();
    jest.isolateModules(() => {
      const RN = require("react-native");
      RN.Platform.OS = "ios";
      RN.UIManager.setLayoutAnimationEnabledExperimental = spy;
      require("../../components/channelCreaModifForm");
    });
    expect(spy).not.toHaveBeenCalled();
  });
});
