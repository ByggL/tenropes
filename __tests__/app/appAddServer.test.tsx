import React from "react";
import { act, create } from "react-test-renderer";
import { Alert, Pressable, TextInput } from "react-native";

const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

const mockDispatch = jest.fn();
const mockUseSelector = jest.fn();
jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector: any) => mockUseSelector(selector),
}));

jest.mock("../../utils/api", () => ({
  API: {
    registerServer: jest.fn(),
    loginServer: jest.fn(),
  },
}));
import { API } from "../../utils/api";
const mockRegister = API.registerServer as jest.Mock;
const mockLogin = API.loginServer as jest.Mock;

import AddServerModal from "../../app/add-server";

function render() {
  let renderer: any;
  act(() => {
    renderer = create(<AddServerModal />);
  });
  return renderer;
}

// Pressable/TextInput render as forwardRef components whose identity differs from
// the imported symbol under jest-expo, so we match on their props instead of type.
function getPressables(root: any) {
  return root.findAll((n: any) => n.props && typeof n.props.onPress === "function");
}
function getInputs(root: any) {
  return root.findAll((n: any) => n.type === TextInput);
}

// Helper: set a TextInput's value by its placeholder
function setInput(root: any, placeholder: string, value: string) {
  const input = root.findAll(
    (n: any) => n.type === TextInput && n.props.placeholder === placeholder,
  )[0];
  act(() => input.props.onChangeText(value));
}

const goodLogin = { access_token: "acc", refresh_token: "ref" };

describe("app/add-server.tsx", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSelector.mockReturnValue({}); // no servers -> hasServers false
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
    mockLogin.mockResolvedValue(goodLogin);
    mockRegister.mockResolvedValue({});
  });

  it("renders and toggles between login and register modes", () => {
    const r = render();
    const pressables = getPressables(r.root);
    // pressables[0] = Sign In, [1] = Register
    act(() => pressables[1].props.onPress()); // switch to register
    // Register mode reveals the invitation code + confirm password inputs
    expect(getInputs(r.root).length).toBe(6); // url, code, nickname, username, password, confirm
    act(() => pressables[0].props.onPress()); // back to login
    expect(getInputs(r.root).length).toBe(4);
  });

  it("alerts when required fields are missing", async () => {
    const r = render();
    const connect = getPressables(r.root)[2];
    await act(async () => {
      await connect.props.onPress();
    });
    expect(Alert.alert).toHaveBeenCalledWith("Missing fields", expect.any(String));
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("logs in successfully and navigates, trimming trailing slash from URL", async () => {
    const r = render();
    setInput(r.root, "http://192.168.1...", "  http://host.fr/  ");
    setInput(r.root, "User", "alice");
    setInput(r.root, "••••••••", "secret");
    const connect = getPressables(r.root)[2];
    await act(async () => {
      await connect.props.onPress();
    });
    expect(mockLogin).toHaveBeenCalledWith("http://host.fr", "alice", "secret");
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ serverId: "http://host.fr", status: "CONNECTED" }),
      }),
    );
    expect(mockReplace).toHaveBeenCalledWith("/(tabs)/channelSelectionPage");
  });

  it("registers then logs in, showing a success alert", async () => {
    const r = render();
    act(() => getPressables(r.root)[1].props.onPress()); // register mode
    setInput(r.root, "http://192.168.1...", "http://host.fr");
    setInput(r.root, "User", "bob");
    // both password fields share the same placeholder
    const pwInputs = r.root.findAll(
      (n: any) => n.type === TextInput && n.props.placeholder === "••••••••",
    );
    act(() => pwInputs[0].props.onChangeText("secret1"));
    act(() => pwInputs[1].props.onChangeText("secret1"));
    setInput(r.root, "Secret code from host", "INVITE");
    const connect = getPressables(r.root)[2];
    await act(async () => {
      await connect.props.onPress();
    });
    expect(mockRegister).toHaveBeenCalledWith("http://host.fr", "bob", "secret1", "INVITE");
    expect(mockLogin).toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith("Success", "Account created successfully!");
    expect(mockReplace).toHaveBeenCalled();
  });

  it("rejects a too-short password in register mode", async () => {
    const r = render();
    act(() => getPressables(r.root)[1].props.onPress());
    setInput(r.root, "http://192.168.1...", "http://host.fr");
    setInput(r.root, "User", "bob");
    const pwInputs = r.root.findAll(
      (n: any) => n.type === TextInput && n.props.placeholder === "••••••••",
    );
    act(() => pwInputs[0].props.onChangeText("123"));
    act(() => pwInputs[1].props.onChangeText("123"));
    await act(async () => {
      await getPressables(r.root)[2].props.onPress();
    });
    expect(mockRegister).not.toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith(
      "Registration Failed",
      "Password must be at least 6 characters long.",
    );
  });

  it("rejects mismatched passwords in register mode", async () => {
    const r = render();
    act(() => getPressables(r.root)[1].props.onPress());
    setInput(r.root, "http://192.168.1...", "http://host.fr");
    setInput(r.root, "User", "bob");
    const pwInputs = r.root.findAll(
      (n: any) => n.type === TextInput && n.props.placeholder === "••••••••",
    );
    act(() => pwInputs[0].props.onChangeText("secret1"));
    act(() => pwInputs[1].props.onChangeText("secret2"));
    await act(async () => {
      await getPressables(r.root)[2].props.onPress();
    });
    expect(Alert.alert).toHaveBeenCalledWith("Registration Failed", "Passwords do not match.");
  });

  it("throws when the server returns no access token", async () => {
    mockLogin.mockResolvedValueOnce({});
    const r = render();
    setInput(r.root, "http://192.168.1...", "http://host.fr");
    setInput(r.root, "User", "alice");
    setInput(r.root, "••••••••", "secret");
    await act(async () => {
      await getPressables(r.root)[2].props.onPress();
    });
    expect(Alert.alert).toHaveBeenCalledWith(
      "Connection Failed",
      "Invalid response from server. Check your URL.",
    );
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("surfaces a generic error message when the message is absent", async () => {
    mockLogin.mockRejectedValueOnce({});
    const r = render();
    setInput(r.root, "http://192.168.1...", "http://host.fr");
    setInput(r.root, "User", "alice");
    setInput(r.root, "••••••••", "secret");
    await act(async () => {
      await getPressables(r.root)[2].props.onPress();
    });
    expect(Alert.alert).toHaveBeenCalledWith(
      "Connection Failed",
      "Check the URL, username, and password.",
    );
  });

  it("uses the default nickname when the field is emptied", async () => {
    const r = render();
    setInput(r.root, "http://192.168.1...", "http://host.fr");
    setInput(r.root, "User", "alice");
    setInput(r.root, "••••••••", "secret");
    setInput(r.root, "Home Server", ""); // clear nickname
    await act(async () => {
      await getPressables(r.root)[2].props.onPress();
    });
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ serverNickname: "My Server" }),
      }),
    );
  });

  it("shows a Go Back button when servers already exist and navigates back", () => {
    mockUseSelector.mockReturnValue({ "http://existing": {} });
    const r = render();
    const pressables = getPressables(r.root);
    // Go Back is the last pressable (index 3 in login mode)
    act(() => pressables[pressables.length - 1].props.onPress());
    expect(mockReplace).toHaveBeenCalledWith("/(tabs)/channelSelectionPage");
  });

  it("resolves accounts through the selector when the servers slice is undefined", () => {
    mockUseSelector.mockImplementation((selector: any) => selector({ servers: undefined }));
    const r = render();
    // No Go Back button because there are no servers
    expect(getPressables(r.root).length).toBe(3);
  });

  it("renders with the dark theme and the iOS keyboard behavior", () => {
    const RN = require("react-native");
    const spy = jest.spyOn(RN, "useColorScheme").mockReturnValue("dark");
    RN.Platform.OS = "ios";
    const r = render();
    expect(r.toJSON()).toBeTruthy();
    RN.Platform.OS = "android";
    spy.mockRestore();
  });

  it("exercises the pressed style callback and shows a spinner while loading", () => {
    mockLogin.mockReturnValueOnce(new Promise(() => {})); // never resolves -> stays loading
    const r = render();
    setInput(r.root, "http://192.168.1...", "http://host.fr");
    setInput(r.root, "User", "alice");
    setInput(r.root, "••••••••", "secret");
    const connect = getPressables(r.root)[2];
    // pressed:true branch of the style function
    expect(connect.props.style({ pressed: true })).toBeTruthy();
    act(() => {
      connect.props.onPress(); // fire without awaiting so loading stays true
    });
    // Spinner (ActivityIndicator) should now be present
    const { ActivityIndicator } = require("react-native");
    expect(r.root.findAllByType(ActivityIndicator).length).toBeGreaterThan(0);
  });
});
