import React from "react";
import { act, create } from "react-test-renderer";
import { markSessionExpired, setServerChannels, setServerStatus } from "../../store/serversSlice";

const mockPush = jest.fn();
jest.mock("expo-router", () => {
  const R = require("react");
  return {
    useRouter: () => ({ push: mockPush }),
    // Mirror real behaviour: run the callback inside an effect, not during render
    useFocusEffect: (cb: any) => R.useEffect(() => cb(), []),
  };
});

const mockDispatch = jest.fn();
const mockUseSelector = jest.fn();
jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector: any) => mockUseSelector(selector),
}));

const mockGetChannels = jest.fn();
jest.mock("@/utils/api", () => ({
  API: jest.fn().mockImplementation(() => ({ getChannels: mockGetChannels })),
}));

jest.mock("@/components/channelCard", () => () => null);
jest.mock("@expo/vector-icons", () => ({ FontAwesome: () => null }));

import ChannelSelectionPage from "../../app/(tabs)/channelSelectionPage";

function findByProp(root: any, prop: string) {
  return root.findAll((n: any) => n.props && typeof n.props[prop] === "function");
}
function getPressables(root: any) {
  return root.findAll((n: any) => n.props && typeof n.props.onPress === "function");
}

// Track every renderer so we can unmount them after each test. Leftover mounted
// trees can flush async state updates into a later test and trip act() warnings.
const renderers: any[] = [];

async function renderPage() {
  let r: any;
  await act(async () => {
    r = create(<ChannelSelectionPage />);
  });
  // flush the async refreshAll kicked off by useFocusEffect
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
  renderers.push(r);
  return r;
}

const server = (over: any = {}) => ({
  serverId: "http://s1",
  serverNickname: "S1",
  status: "CONNECTED",
  channels: [],
  ...over,
});

describe("app/(tabs)/channelSelectionPage.tsx", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
    mockUseSelector.mockImplementation((selector: any) => selector({ servers: { accounts: {} } }));
    mockGetChannels.mockResolvedValue([{ id: 1 }]);
  });
  afterEach(async () => {
    // Unmount everything mounted during the test before restoring mocks so no
    // pending async update leaks into the next test.
    await act(async () => {
      renderers.forEach((r) => {
        try {
          r.unmount();
        } catch {}
      });
      await Promise.resolve();
    });
    renderers.length = 0;
    jest.restoreAllMocks();
  });

  it("renders empty list and covers the accounts fallback when servers slice is undefined", async () => {
    mockUseSelector.mockImplementation((selector: any) => selector({ servers: undefined }));
    const r = await renderPage();
    // refreshAll returns early (no servers); header plus button navigates
    const plus = getPressables(r.root).find((p: any) => true);
    act(() => plus.props.onPress());
    expect(mockPush).toHaveBeenCalledWith("/add-server");
  });

  it("refreshAll fetches channels successfully for connected servers", async () => {
    mockUseSelector.mockImplementation((selector: any) =>
      selector({ servers: { accounts: { "http://s1": server() } } }),
    );
    mockGetChannels.mockResolvedValueOnce([{ id: 7 }]);
    await renderPage();
    expect(mockDispatch).toHaveBeenCalledWith(setServerStatus({ serverId: "http://s1", status: "LOADING" }));
    expect(mockDispatch).toHaveBeenCalledWith(setServerChannels({ serverId: "http://s1", channels: [{ id: 7 }] }));
  });

  it("marks the session expired on 401 and 403 responses", async () => {
    mockUseSelector.mockImplementation((selector: any) =>
      selector({ servers: { accounts: { "http://s1": server() } } }),
    );
    mockGetChannels.mockRejectedValueOnce({ response: { status: 401 } });
    await renderPage();
    expect(mockDispatch).toHaveBeenCalledWith(markSessionExpired("http://s1"));

    jest.clearAllMocks();
    mockUseSelector.mockImplementation((selector: any) =>
      selector({ servers: { accounts: { "http://s1": server() } } }),
    );
    mockGetChannels.mockRejectedValueOnce({ response: { status: 403 } });
    await renderPage();
    expect(mockDispatch).toHaveBeenCalledWith(markSessionExpired("http://s1"));
  });

  it("marks the server offline on other errors", async () => {
    mockUseSelector.mockImplementation((selector: any) =>
      selector({ servers: { accounts: { "http://s1": server() } } }),
    );
    mockGetChannels.mockRejectedValueOnce({ response: { status: 500 } });
    await renderPage();
    expect(mockDispatch).toHaveBeenCalledWith(setServerStatus({ serverId: "http://s1", status: "OFFLINE" }));
  });

  it("renders a CONNECTED server group with channels and navigates on channel press", async () => {
    mockUseSelector.mockImplementation((selector: any) =>
      selector({ servers: { accounts: {} } }),
    );
    const r = await renderPage();
    const flatList = findByProp(r.root, "renderItem")[0];
    const connected = server({ channels: [{ id: 1, name: "general" }] });

    let sub: any;
    act(() => {
      sub = create(<>{flatList.props.renderItem({ item: connected })}</>);
    });
    // keyExtractor
    expect(flatList.props.keyExtractor(connected)).toBe("http://s1");

    const channelPressable = getPressables(sub.root)[0];
    // style function both branches
    expect(channelPressable.props.style({ pressed: true })).toBeTruthy();
    expect(channelPressable.props.style({ pressed: false })).toBeTruthy();
    act(() => channelPressable.props.onPress());
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(tabs)/channelPage",
      params: { channel: JSON.stringify({ id: 1, name: "general" }), serverUrl: "http://s1" },
    });
  });

  it("renders each non-connected status box and retries offline servers", async () => {
    mockUseSelector.mockImplementation((selector: any) => selector({ servers: { accounts: {} } }));
    const r = await renderPage();
    const flatList = findByProp(r.root, "renderItem")[0];

    const statuses = ["OFFLINE", "SESSION_EXPIRED", "LOADING", "CONNECTED", "UNKNOWN"];
    for (const status of statuses) {
      let sub: any;
      const item = server({ status, channels: [] });
      act(() => {
        sub = create(<>{flatList.props.renderItem({ item })}</>);
      });
      renderers.push(sub);
      if (status === "OFFLINE") {
        // Retry pressable present -> fires fetchServerData
        const retry = getPressables(sub.root)[0];
        await act(async () => {
          await retry.props.onPress();
        });
        expect(mockDispatch).toHaveBeenCalledWith(setServerStatus({ serverId: "http://s1", status: "LOADING" }));
      }
      expect(sub.toJSON()).toBeTruthy();
    }
  });

  it("exercises RefreshControl onRefresh and ListEmptyComponent", async () => {
    mockUseSelector.mockImplementation((selector: any) =>
      selector({ servers: { accounts: { "http://s1": server() } } }),
    );
    const r = await renderPage();
    const flatList = findByProp(r.root, "renderItem")[0];
    await act(async () => {
      await flatList.props.refreshControl.props.onRefresh();
    });
    // ListEmptyComponent is a valid element
    expect(flatList.props.ListEmptyComponent).toBeTruthy();
  });

  it("falls back to the light theme when the color scheme is null", async () => {
    const RN = require("react-native");
    const spy = jest.spyOn(RN, "useColorScheme").mockReturnValue(null);
    const r = await renderPage();
    expect(r.toJSON()).toBeTruthy();
    spy.mockRestore();
  });
});
