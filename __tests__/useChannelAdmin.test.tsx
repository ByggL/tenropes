import React from "react";
import { act, create } from "react-test-renderer";
import { useChannelAdmin } from "../hooks/useChannelAdmin";
import { store } from "../store";
import { API } from "../utils/api";
import { Alert, Share } from "react-native";

jest.mock("../store", () => ({
  store: {
    getState: jest.fn(),
  },
}));
const mockedStore = store as jest.Mocked<typeof store>;

jest.mock("../utils/api");
const MockedAPI = API as jest.MockedClass<typeof API>;
const mockCreateInvite = jest.fn();
// @ts-ignore
MockedAPI.prototype.createInvite = mockCreateInvite;

function TestComponent({ hookParams, callback }: { hookParams: any; callback: any }) {
  const hookResult = useChannelAdmin(hookParams.channel, hookParams.serverUrl);
  callback(hookResult);
  return null;
}

function renderUseChannelAdmin(initialParams: { channel: any; serverUrl: string }) {
  let result: any = null;
  const callback = (res: any) => {
    result = res;
  };
  
  let renderer: any;
  act(() => {
    renderer = create(<TestComponent hookParams={initialParams} callback={callback} />);
  });

  return {
    get result() {
      return result;
    },
    rerender: (newParams: { channel: any; serverUrl: string }) => {
      act(() => {
        renderer.update(<TestComponent hookParams={newParams} callback={callback} />);
      });
    }
  };
}

describe("useChannelAdmin Hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateInvite.mockReset();
    mockedStore.getState.mockReturnValue({ servers: { accounts: {} } });
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
    jest.spyOn(Share, "share").mockResolvedValue({ action: "sharedAction" });
  });

  it("should initialize with default states and handle early returns when parameters are missing", () => {
    const wrapper = renderUseChannelAdmin({ channel: null, serverUrl: "" });

    expect(wrapper.result.isAdmin).toBe(false);
    expect(wrapper.result.isQrModalVisible).toBe(false);
    expect(wrapper.result.qrInviteLink).toBe("");
    expect(wrapper.result.isLoadingQr).toBe(false);

    // Call functions with missing params
    act(() => {
      wrapper.result.handleShowQrCode();
      wrapper.result.handleShareInvite();
    });

    expect(mockCreateInvite).not.toHaveBeenCalled();
  });

  it("should return early in useEffect if channel is provided but serverUrl is missing", () => {
    const mockChannel = { id: 1, name: "admin-ch", creator: "adminUser", creatorId: 10, img: "", theme: {} as any, members: [] };
    const wrapper = renderUseChannelAdmin({ channel: mockChannel, serverUrl: "" });
    expect(wrapper.result.isAdmin).toBe(false);
  });

  it("should set isAdmin to true if current user is channel creator", async () => {
    mockedStore.getState.mockReturnValue({
      servers: {
        accounts: {
          "http://localhost:3000": { username: "adminUser" },
        },
      },
    });

    const mockChannel = { id: 1, name: "admin-ch", creator: "adminUser", creatorId: 10, img: "", theme: {} as any, members: [] };

    const wrapper = renderUseChannelAdmin({ channel: mockChannel, serverUrl: "http://localhost:3000" });
    expect(wrapper.result.isAdmin).toBe(true);
  });

  it("should set isAdmin to false if current user is NOT channel creator", async () => {
    mockedStore.getState.mockReturnValue({
      servers: {
        accounts: {
          "http://localhost:3000": { username: "normalUser" },
        },
      },
    });

    const mockChannel = { id: 1, name: "admin-ch", creator: "adminUser", creatorId: 10, img: "", theme: {} as any, members: [] };

    const wrapper = renderUseChannelAdmin({ channel: mockChannel, serverUrl: "http://localhost:3000" });
    expect(wrapper.result.isAdmin).toBe(false);
  });

  it("should handle error checking admin status safely", async () => {
    mockedStore.getState.mockImplementationOnce(() => {
      throw new Error("Store crashed");
    });
    const mockChannel = { id: 1, name: "admin-ch", creator: "adminUser", creatorId: 10, img: "", theme: {} as any, members: [] };
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const wrapper = renderUseChannelAdmin({ channel: mockChannel, serverUrl: "http://localhost:3000" });

    expect(wrapper.result.isAdmin).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it("should generate and set QR invite link successfully on handleShowQrCode", async () => {
    mockCreateInvite.mockResolvedValueOnce("http://invite.link/xyz");
    const mockChannel = { id: 42, name: "my-ch", creator: "other", creatorId: 10, img: "", theme: {} as any, members: [] };

    const wrapper = renderUseChannelAdmin({ channel: mockChannel, serverUrl: "http://localhost:3000" });

    await act(async () => {
      await wrapper.result.handleShowQrCode();
    });

    expect(mockCreateInvite).toHaveBeenCalledWith(42);
    expect(wrapper.result.qrInviteLink).toBe("http://invite.link/xyz");
    expect(wrapper.result.isQrModalVisible).toBe(true);
    expect(wrapper.result.isLoadingQr).toBe(false);

    // Second call should return early since qrInviteLink is already set
    jest.clearAllMocks();
    await act(async () => {
      await wrapper.result.handleShowQrCode();
    });
    expect(mockCreateInvite).not.toHaveBeenCalled();
  });

  it("should handle QR generation early return when serverUrl is missing", async () => {
    const mockChannel = { id: 42, name: "my-ch", creator: "other", creatorId: 10, img: "", theme: {} as any, members: [] };
    const wrapper = renderUseChannelAdmin({ channel: mockChannel, serverUrl: "" });
    await act(async () => {
      await wrapper.result.handleShowQrCode();
    });
    expect(mockCreateInvite).not.toHaveBeenCalled();
  });

  it("should handle QR generation error and display Alert", async () => {
    mockCreateInvite.mockRejectedValueOnce(new Error("API limit reached"));
    const mockChannel = { id: 42, name: "my-ch", creator: "other", creatorId: 10, img: "", theme: {} as any, members: [] };

    const wrapper = renderUseChannelAdmin({ channel: mockChannel, serverUrl: "http://localhost:3000" });

    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    await act(async () => {
      await wrapper.result.handleShowQrCode();
    });

    expect(wrapper.result.qrInviteLink).toBe("");
    expect(wrapper.result.isQrModalVisible).toBe(false);
    expect(wrapper.result.isLoadingQr).toBe(false);
    expect(Alert.alert).toHaveBeenCalledWith("Error", "Could not generate QR code.");
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it("should share invite link successfully on handleShareInvite", async () => {
    mockCreateInvite.mockResolvedValueOnce("http://invite.link/xyz");
    const mockChannel = { id: 42, name: "general", creator: "other", creatorId: 10, img: "", theme: {} as any, members: [] };

    const wrapper = renderUseChannelAdmin({ channel: mockChannel, serverUrl: "http://localhost:3000" });

    await act(async () => {
      await wrapper.result.handleShareInvite();
    });

    expect(mockCreateInvite).toHaveBeenCalledWith(42);
    expect(Share.share).toHaveBeenCalledWith({
      message: "Join me in #general on Tenropes! Here is your invite link: http://invite.link/xyz",
      url: "http://invite.link/xyz",
      title: "Invite to general",
    });
    expect(wrapper.result.isSharing).toBe(false);
  });

  it("should return early in handleShareInvite if already sharing", async () => {
    const mockChannel = { id: 42, name: "general", creator: "other", creatorId: 10, img: "", theme: {} as any, members: [] };
    const wrapper = renderUseChannelAdmin({ channel: mockChannel, serverUrl: "http://localhost:3000" });

    act(() => {
      wrapper.result.setIsSharing(true);
    });

    await act(async () => {
      await wrapper.result.handleShareInvite();
    });

    expect(mockCreateInvite).not.toHaveBeenCalled();
  });

  it("should handle share invite failure and display Alert", async () => {
    mockCreateInvite.mockRejectedValueOnce(new Error("Share failure"));
    const mockChannel = { id: 42, name: "general", creator: "other", creatorId: 10, img: "", theme: {} as any, members: [] };

    const wrapper = renderUseChannelAdmin({ channel: mockChannel, serverUrl: "http://localhost:3000" });

    await act(async () => {
      await wrapper.result.handleShareInvite();
    });

    expect(Alert.alert).toHaveBeenCalledWith("Error", "Could not share invite link.");
    expect(wrapper.result.isSharing).toBe(false);
  });
});
