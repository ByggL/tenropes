import React from "react";
import { act, create } from "react-test-renderer";
import { useChannelMessages } from "../../hooks/useChannelMessages";
import { store } from "../../store";
import { API } from "../../utils/api";
import { io } from "socket.io-client";

// Mock store
jest.mock("../../store", () => ({
  store: {
    getState: jest.fn(),
  },
}));
const mockedStore = store as jest.Mocked<typeof store>;

// Mock API
jest.mock("../../utils/api");
const MockedAPI = API as jest.MockedClass<typeof API>;
const mockGetMessages = jest.fn();
const mockGetUserData = jest.fn();
const mockSendMessage = jest.fn();
const mockUploadImage = jest.fn();

MockedAPI.prototype.getMessages = mockGetMessages;
MockedAPI.prototype.getUserData = mockGetUserData;
MockedAPI.prototype.sendMessage = mockSendMessage;
MockedAPI.prototype.uploadImage = mockUploadImage;

// Mock socket.io-client
let capturedSocketListeners: Record<string, any> = {};
const mockSocket = {
  on: jest.fn((event, callback) => {
    capturedSocketListeners[event] = callback;
  }),
  emit: jest.fn(),
  disconnect: jest.fn(),
};

jest.mock("socket.io-client", () => ({
  io: jest.fn(() => mockSocket),
}));

let mockHasMoreValue = false;
const originalUseState = React.useState;
jest.spyOn(React, "useState").mockImplementation((init) => {
  if (init === true) {
    return [mockHasMoreValue, jest.fn()];
  }
  return originalUseState(init);
});

function TestMessagesComponent({ channel, setMembers, serverUrl, callback }: { channel: any; setMembers: any; serverUrl: string; callback: any }) {
  const result = useChannelMessages(channel, setMembers, serverUrl);
  callback(result);
  return null;
}

function renderUseChannelMessages(channel: any, setMembers: any, serverUrl: string) {
  let result: any = null;
  const callback = (res: any) => {
    result = res;
  };
  let renderer: any;
  act(() => {
    renderer = create(
      <TestMessagesComponent channel={channel} setMembers={setMembers} serverUrl={serverUrl} callback={callback} />
    );
  });
  return {
    get result() {
      return result;
    },
    unmount: () => {
      act(() => {
        renderer.unmount();
      });
    }
  };
}

describe("useChannelMessages Hook", () => {
  const mockChannel = {
    id: 1,
    name: "general",
    img: "",
    creatorId: 10,
    theme: {} as any,
    members: [
      { role: "member", user: { username: "alice" } }
    ]
  };
  const mockSetMembers = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockHasMoreValue = false;
    capturedSocketListeners = {};
    mockGetMessages.mockResolvedValue([]);
    mockGetUserData.mockResolvedValue([]);
    mockSendMessage.mockResolvedValue("sent");
    mockUploadImage.mockResolvedValue({ url: "http://uploaded.img/pic.png" });
    
    mockedStore.getState.mockReturnValue({
      servers: {
        accounts: {
          "http://localhost:3000": { accessToken: "access_token_123" }
        }
      }
    });
  });

  it("should initialize hook and setup dynamic websocket connections", async () => {
    mockGetMessages.mockResolvedValueOnce([
      { id: 1, type: "Text", content: "hello" },
      { id: 2, type: "Text", content: "world" },
    ]);
    mockGetUserData.mockResolvedValueOnce([{ username: "alice" }]);

    let hook: any;
    await act(async () => {
      hook = renderUseChannelMessages(mockChannel, mockSetMembers, "http://localhost:3000");
    });

    expect(mockGetMessages).toHaveBeenCalledWith(1, 0);
    expect(mockGetUserData).toHaveBeenCalledWith(["alice"]);
    expect(mockSetMembers).toHaveBeenCalledWith([{ username: "alice" }]);

    // Initial messages reversed: world (id 2) then hello (id 1)
    expect(hook.result.messages).toEqual([
      { id: 2, type: "Text", content: "world" },
      { id: 1, type: "Text", content: "hello" },
    ]);

    // Socket should be constructed
    expect(io).toHaveBeenCalledWith("http://localhost:3000", expect.objectContaining({
      auth: { token: "access_token_123" }
    }));

    // Trigger connect event listener
    expect(capturedSocketListeners["connect"]).toBeDefined();
    await act(async () => {
      capturedSocketListeners["connect"]();
    });
    expect(mockSocket.emit).toHaveBeenCalledWith("joinChannel", 1);

    // Trigger message event listener
    expect(capturedSocketListeners["message"]).toBeDefined();
    const newMessage = { id: 3, type: "Text", content: "socket message" };
    await act(async () => {
      capturedSocketListeners["message"](newMessage);
    });
    expect(hook.result.messages[0]).toEqual(newMessage);

    // Trigger message duplicate check
    await act(async () => {
      capturedSocketListeners["message"](newMessage); // duplicate ID 3
    });
    expect(hook.result.messages.length).toBe(3); // still 3 messages

    // Clean up
    hook.unmount();
    expect(mockSocket.emit).toHaveBeenCalledWith("leaveChannel", 1);
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  it("should return early in useEffect if channel or serverUrl is null", async () => {
    let hook: any;
    await act(async () => {
      hook = renderUseChannelMessages(null as any, mockSetMembers, "");
    });
    expect(io).not.toHaveBeenCalled();
  });

  describe("loadOlderMessages", () => {
    beforeEach(() => {
      mockHasMoreValue = true;
    });

    it("should fetch older messages if hasMore is true", async () => {
      mockGetMessages
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(Array(40).fill({ id: 10, type: "Text", content: "old message" }));
      const hook = renderUseChannelMessages(mockChannel, mockSetMembers, "http://localhost:3000");

      await act(async () => {
        await hook.result.loadOlderMessages();
      });
      expect(mockGetMessages).toHaveBeenCalledWith(1, 40);
    });

    it("should fetch older messages and mark hasMore to false if returned batch is smaller than 40", async () => {
      mockGetMessages
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ id: 10, type: "Text", content: "old message" }]);
      const hook = renderUseChannelMessages(mockChannel, mockSetMembers, "http://localhost:3000");

      await act(async () => {
        await hook.result.loadOlderMessages();
      });

      // Expect it to process and save
      expect(hook.result.messages.length).toBe(1);
    });

    it("should handle error in loadOlderMessages gracefully", async () => {
      mockGetMessages
        .mockResolvedValueOnce([])
        .mockRejectedValueOnce(new Error("History error"));
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      const hook = renderUseChannelMessages(mockChannel, mockSetMembers, "http://localhost:3000");
      await act(async () => {
        await hook.result.loadOlderMessages();
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it("should return early in loadOlderMessages if serverUrl is missing", async () => {
      const hook = renderUseChannelMessages(mockChannel, mockSetMembers, "");
      await act(async () => {
        await hook.result.loadOlderMessages();
      });
      expect(mockGetMessages).not.toHaveBeenCalled();
    });

    it("should return early in loadOlderMessages if hasMore is false", async () => {
      mockHasMoreValue = false;
      const hook = renderUseChannelMessages(mockChannel, mockSetMembers, "http://localhost:3000");
      await act(async () => {
        await hook.result.loadOlderMessages();
      });
      expect(mockGetMessages).toHaveBeenCalledTimes(1); // Only mount call
    });

    it("should not add messages or set offset if olderMessages is empty", async () => {
      mockGetMessages
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]); // empty history
      const hook = renderUseChannelMessages(mockChannel, mockSetMembers, "http://localhost:3000");
      await act(async () => {
        await hook.result.loadOlderMessages();
      });
      expect(hook.result.messages.length).toBe(0);
    });
  });

  describe("sendMessage", () => {
    it("should send text message successfully", async () => {
      const hook = renderUseChannelMessages(mockChannel, mockSetMembers, "http://localhost:3000");
      await act(async () => {
        await hook.result.sendMessage("hello");
      });
      expect(mockSendMessage).toHaveBeenCalledWith(1, {
        type: "Text",
        content: "hello",
      });
    });

    it("should upload image and send image message", async () => {
      const hook = renderUseChannelMessages(mockChannel, mockSetMembers, "http://localhost:3000");
      const mockImageFile = "blob-file";
      await act(async () => {
        await hook.result.sendMessage("", mockImageFile);
      });
      expect(mockUploadImage).toHaveBeenCalledWith("blob-file");
      expect(mockSendMessage).toHaveBeenCalledWith(1, {
        type: "Image",
        content: "http://uploaded.img/pic.png",
      });
    });

    it("should send image URL as Image type message", async () => {
      const hook = renderUseChannelMessages(mockChannel, mockSetMembers, "http://localhost:3000");
      await act(async () => {
        await hook.result.sendMessage("http://example.com/pic.jpg");
      });
      expect(mockSendMessage).toHaveBeenCalledWith(1, {
        type: "Image",
        content: "http://example.com/pic.jpg",
      });
    });

    it("should send image and follow up with text if both are provided", async () => {
      const hook = renderUseChannelMessages(mockChannel, mockSetMembers, "http://localhost:3000");
      const mockImageFile = "blob-file";
      await act(async () => {
        await hook.result.sendMessage("my text caption", mockImageFile);
      });
      expect(mockUploadImage).toHaveBeenCalledWith("blob-file");
      expect(mockSendMessage).toHaveBeenNthCalledWith(1, 1, {
        type: "Image",
        content: "http://uploaded.img/pic.png",
      });
      expect(mockSendMessage).toHaveBeenNthCalledWith(2, 1, {
        type: "Text",
        content: "my text caption",
      });
    });

    it("should handle sendMessage error gracefully", async () => {
      mockSendMessage.mockRejectedValueOnce(new Error("Send failed"));
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      const hook = renderUseChannelMessages(mockChannel, mockSetMembers, "http://localhost:3000");
      await act(async () => {
        await hook.result.sendMessage("hello");
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it("should return early if channel, content, or serverUrl is missing", async () => {
      const hook = renderUseChannelMessages(mockChannel, mockSetMembers, "http://localhost:3000");
      
      await act(async () => {
        await hook.result.sendMessage("   ");
      });
      expect(mockSendMessage).not.toHaveBeenCalled();

      const hookNoServer = renderUseChannelMessages(mockChannel, mockSetMembers, "");
      await act(async () => {
        await hookNoServer.result.sendMessage("hello");
      });
      expect(mockSendMessage).not.toHaveBeenCalled();
    });
  });
});
