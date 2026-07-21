import React from "react";
import { act, create } from "react-test-renderer";

jest.mock("expo-router", () => ({ useRouter: () => ({ replace: jest.fn() }) }));
jest.mock("react-redux", () => ({
  useDispatch: () => jest.fn(),
  useSelector: () => ({}),
}));
jest.mock("../../utils/api", () => ({
  API: { registerServer: jest.fn(), loginServer: jest.fn() },
}));

// Empty theme -> every `theme.X || "fallback"` takes its fallback branch
jest.mock("@/constants/Colors", () => ({ __esModule: true, default: { light: {}, dark: {} } }));

import AddServerModal from "../../app/add-server";

describe("app/add-server.tsx theme fallbacks", () => {
  it("renders with an empty theme in both modes, hitting the color fallbacks", () => {
    let r: any;
    act(() => {
      r = create(<AddServerModal />);
    });
    // Switch to register mode to render the register-only inputs with fallbacks too
    const pressables = r.root.findAll((n: any) => n.props && typeof n.props.onPress === "function");
    act(() => pressables[1].props.onPress());
    expect(r.toJSON()).toBeTruthy();
  });
});
