import React from "react";
import { act, create } from "react-test-renderer";

// Render FlatList items inline so the component's own state drives re-renders.
jest.mock("react-native", () => {
  const RN = jest.requireActual("react-native");
  const MockFlatList = (props: any) => {
    const R = require("react");
    const { data = [], renderItem, keyExtractor } = props;
    return R.createElement(
      RN.View,
      null,
      data.map((item: any, index: number) =>
        R.createElement(R.Fragment, { key: keyExtractor ? keyExtractor(item) : index }, renderItem({ item, index })),
      ),
    );
  };
  return new Proxy(RN, { get: (t, k) => (k === "FlatList" ? MockFlatList : (t as any)[k]) });
});

import { Alert, TextInput } from "react-native";

const mockReplace = jest.fn();
jest.mock("expo-router", () => ({ useRouter: () => ({ replace: mockReplace }) }));

let mockAccounts: Record<string, any> = {};
const mockDispatch = jest.fn();
jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector: any) => selector({ servers: { accounts: mockAccounts } }),
}));

const mockRemoveThunk = jest.fn((id: string) => ({ type: "remove", payload: id }));
jest.mock("@/store/serverThunks", () => ({ removeServerAndToken: (id: string) => mockRemoveThunk(id) }));

const mockUpdateNickname = jest.fn((a: any) => ({ type: "nick", payload: a }));
jest.mock("../../store/serversSlice", () => ({ updateServerNickname: (a: any) => mockUpdateNickname(a) }));

jest.mock("@expo/vector-icons", () => ({ FontAwesome: () => null }));
jest.mock("react-native-safe-area-context", () => ({ SafeAreaView: ({ children }: any) => children }));

import ManageServersPage from "../../app/(tabs)/manageServers";

function getPressables(root: any) {
  return root.findAll((n: any) => n.props && typeof n.props.onPress === "function");
}
function getInputs(root: any) {
  return root.findAll((n: any) => n.type === TextInput);
}
function renderPage(Comp: any = ManageServersPage) {
  let renderer: any;
  act(() => {
    renderer = create(<Comp />);
  });
  return renderer;
}

const serverA = { serverId: "http://a", serverNickname: "Alpha", username: "alice", status: "CONNECTED" };
const serverB = { serverId: "http://b", serverNickname: "Beta", username: "bob", status: "CONNECTED" };

describe("app/(tabs)/manageServers.tsx", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAccounts = {};
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  it("renders the empty state when there are no servers", () => {
    const r = renderPage();
    expect(JSON.stringify(r.toJSON())).toContain("No servers configured.");
  });

  it("renders a server row with its nickname when not editing", () => {
    mockAccounts = { "http://a": serverA };
    const r = renderPage();
    expect(JSON.stringify(r.toJSON())).toContain("Alpha");
    // pencil + trash on the single row
    expect(getPressables(r.root).length).toBe(2);
  });

  it("starts editing, edits the name, and saves it via onSubmitEditing", () => {
    mockAccounts = { "http://a": serverA };
    const r = renderPage();
    act(() => getPressables(r.root)[0].props.onPress()); // pencil -> handleEditStart
    const input = getInputs(r.root)[0];
    expect(input.props.value).toBe("Alpha");
    act(() => input.props.onChangeText("Renamed"));
    act(() => getInputs(r.root)[0].props.onSubmitEditing());
    expect(mockUpdateNickname).toHaveBeenCalledWith({ serverId: "http://a", newNickname: "Renamed" });
    expect(mockDispatch).toHaveBeenCalledWith({ type: "nick", payload: { serverId: "http://a", newNickname: "Renamed" } });
  });

  it("saves via the check button and via onBlur", () => {
    mockAccounts = { "http://a": serverA };
    const r = renderPage();
    act(() => getPressables(r.root)[0].props.onPress()); // enter edit
    // In edit mode the first pressable is the check button
    act(() => getPressables(r.root)[0].props.onPress());
    expect(mockUpdateNickname).toHaveBeenCalledWith({ serverId: "http://a", newNickname: "Alpha" });

    mockUpdateNickname.mockClear();
    act(() => getPressables(r.root)[0].props.onPress()); // re-enter edit
    act(() => getInputs(r.root)[0].props.onBlur());
    expect(mockUpdateNickname).toHaveBeenCalled();
  });

  it("does not dispatch when the edited name is blank", () => {
    mockAccounts = { "http://a": serverA };
    const r = renderPage();
    act(() => getPressables(r.root)[0].props.onPress());
    act(() => getInputs(r.root)[0].props.onChangeText("   "));
    act(() => getInputs(r.root)[0].props.onSubmitEditing());
    expect(mockUpdateNickname).not.toHaveBeenCalled();
  });

  it("deletes the last server and redirects to add-server", async () => {
    mockAccounts = { "http://a": serverA };
    const r = renderPage();
    const pressables = getPressables(r.root);
    act(() => pressables[pressables.length - 1].props.onPress()); // trash
    expect(Alert.alert).toHaveBeenCalled();
    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2];
    await act(async () => {
      await buttons[1].onPress();
    });
    expect(mockRemoveThunk).toHaveBeenCalledWith("http://a");
    expect(mockReplace).toHaveBeenCalledWith("/add-server");
  });

  it("deletes one of several servers without redirecting", async () => {
    mockAccounts = { "http://a": serverA, "http://b": serverB };
    const r = renderPage();
    const pressables = getPressables(r.root);
    // row A = [pencil, trash], row B = [pencil, trash]; trash of the first row is index 1
    act(() => pressables[1].props.onPress());
    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2];
    await act(async () => {
      await buttons[1].onPress();
    });
    expect(mockRemoveThunk).toHaveBeenCalledWith("http://a");
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("logs an error if the disconnect dispatch throws", async () => {
    mockAccounts = { "http://a": serverA };
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockDispatch.mockImplementationOnce(() => {
      throw new Error("boom");
    });
    const r = renderPage();
    const pressables = getPressables(r.root);
    act(() => pressables[pressables.length - 1].props.onPress());
    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2];
    await act(async () => {
      await buttons[1].onPress();
    });
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it("uses the dark color scheme", () => {
    const RN = require("react-native");
    const spy = jest.spyOn(RN, "useColorScheme").mockReturnValue("dark");
    mockAccounts = { "http://a": serverA };
    const r = renderPage();
    expect(r.toJSON()).toBeTruthy();
    spy.mockRestore();
  });
});

describe("app/(tabs)/manageServers.tsx color fallbacks", () => {
  it("falls back to default colors when the theme lacks border/tint", () => {
    jest.isolateModules(() => {
      jest.doMock("@/constants/Colors", () => ({ __esModule: true, default: { light: {}, dark: {} } }));
      // Re-require react + renderer inside the isolated registry so the component and the
      // renderer share the same React instance (otherwise the hooks dispatcher is null).
      const React2 = require("react");
      const { act: act2, create: create2 } = require("react-test-renderer");
      const Page = require("../../app/(tabs)/manageServers").default;
      mockAccounts = { "http://a": serverA };
      let renderer: any;
      act2(() => {
        renderer = create2(React2.createElement(Page));
      });
      // non-editing row hits `theme.border || "#eee"`; enter edit to hit `theme.tint || "#007AFF"`
      act2(() => getPressables(renderer.root)[0].props.onPress());
      expect(renderer.toJSON()).toBeTruthy();
    });
  });
});
