import { registerPushToken, removeServerAndToken } from "../../store/serverThunks";
import { API } from "../../utils/api";
import { removeServer, setServerPushToken } from "../../store/serversSlice";

// Mock API
jest.mock("../../utils/api");
const MockedAPI = API as jest.MockedClass<typeof API>;

// Create mock API instance methods
const mockPostPushToken = jest.fn();
const mockRemovePushToken = jest.fn();

MockedAPI.prototype.postPushToken = mockPostPushToken;
MockedAPI.prototype.removePushToken = mockRemovePushToken;

describe("serverThunks", () => {
  let dispatch: jest.Mock;
  let getState: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    dispatch = jest.fn();
    getState = jest.fn();
  });

  describe("registerPushToken Thunk", () => {
    it("should successfully register push token and dispatch setServerPushToken", async () => {
      mockPostPushToken.mockResolvedValueOnce(undefined);

      const thunk = registerPushToken({ serverId: "http://localhost:3000", expoToken: "expo_token_xyz" });
      await thunk(dispatch, getState, undefined);

      expect(MockedAPI).toHaveBeenCalledWith("http://localhost:3000");
      expect(mockPostPushToken).toHaveBeenCalledWith("expo_token_xyz");
      expect(dispatch).toHaveBeenCalledWith(
        setServerPushToken({ serverId: "http://localhost:3000", token: "expo_token_xyz" })
      );
    });

    it("should handle push token registration failure silently", async () => {
      mockPostPushToken.mockRejectedValueOnce(new Error("API failure"));
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      const thunk = registerPushToken({ serverId: "http://localhost:3000", expoToken: "expo_token_xyz" });
      await thunk(dispatch, getState, undefined);

      expect(mockPostPushToken).toHaveBeenCalled();
      expect(dispatch).not.toHaveBeenCalledWith(setServerPushToken(expect.any(Object)));
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe("removeServerAndToken Thunk", () => {
    it("should call api.removePushToken and dispatch removeServer when token exists and status is not session expired", async () => {
      mockRemovePushToken.mockResolvedValueOnce(undefined);
      getState.mockReturnValue({
        servers: {
          accounts: {
            "http://localhost:3000": {
              pushToken: "tok_123",
              status: "CONNECTED",
            },
          },
        },
      });

      const thunk = removeServerAndToken("http://localhost:3000");
      await thunk(dispatch, getState, undefined);

      expect(MockedAPI).toHaveBeenCalledWith("http://localhost:3000");
      expect(mockRemovePushToken).toHaveBeenCalledWith("tok_123");
      expect(dispatch).toHaveBeenCalledWith(removeServer("http://localhost:3000"));
    });

    it("should not call api.removePushToken but dispatch removeServer if token does not exist", async () => {
      getState.mockReturnValue({
        servers: {
          accounts: {
            "http://localhost:3000": {
              status: "CONNECTED",
            },
          },
        },
      });

      const thunk = removeServerAndToken("http://localhost:3000");
      await thunk(dispatch, getState, undefined);

      expect(MockedAPI).not.toHaveBeenCalled();
      expect(mockRemovePushToken).not.toHaveBeenCalled();
      expect(dispatch).toHaveBeenCalledWith(removeServer("http://localhost:3000"));
    });

    it("should not call api.removePushToken but dispatch removeServer if status is SESSION_EXPIRED", async () => {
      getState.mockReturnValue({
        servers: {
          accounts: {
            "http://localhost:3000": {
              pushToken: "tok_123",
              status: "SESSION_EXPIRED",
            },
          },
        },
      });

      const thunk = removeServerAndToken("http://localhost:3000");
      await thunk(dispatch, getState, undefined);

      expect(MockedAPI).not.toHaveBeenCalled();
      expect(mockRemovePushToken).not.toHaveBeenCalled();
      expect(dispatch).toHaveBeenCalledWith(removeServer("http://localhost:3000"));
    });

    it("should force local removal and dispatch removeServer even if api.removePushToken throws", async () => {
      mockRemovePushToken.mockRejectedValueOnce(new Error("Network disconnect"));
      getState.mockReturnValue({
        servers: {
          accounts: {
            "http://localhost:3000": {
              pushToken: "tok_123",
              status: "CONNECTED",
            },
          },
        },
      });

      const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});

      const thunk = removeServerAndToken("http://localhost:3000");
      await thunk(dispatch, getState, undefined);

      expect(mockRemovePushToken).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith("Serveur http://localhost:3000 injoignable, suppression locale forcée.");
      expect(dispatch).toHaveBeenCalledWith(removeServer("http://localhost:3000"));

      consoleLogSpy.mockRestore();
    });
  });
});
