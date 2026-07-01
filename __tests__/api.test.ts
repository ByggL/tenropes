import axios from "axios";
import { API } from "../utils/api";
import { store } from "../store";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock("../store", () => ({
  store: {
    getState: jest.fn(),
    dispatch: jest.fn(),
  },
}));
const mockedStore = store as jest.Mocked<typeof store>;

let requestInterceptor: any;
let responseInterceptorResolve: any;
let responseInterceptorReject: any;

const mockClient: any = jest.fn();
mockClient.get = jest.fn();
mockClient.post = jest.fn();
mockClient.put = jest.fn();
mockClient.delete = jest.fn();
mockClient.patch = jest.fn();
mockClient.interceptors = {
  request: {
    use: jest.fn((resolve) => {
      requestInterceptor = resolve;
    }),
  },
  response: {
    use: jest.fn((resolve, reject) => {
      responseInterceptorResolve = resolve;
      responseInterceptorReject = reject;
    }),
  },
};

describe("API Static Methods", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.create.mockReturnValue(mockClient as any);
  });

  describe("registerServer", () => {
    it("should successfully register a user", async () => {
      const serverUrl = "http://localhost:3000";
      const username = "newuser";
      const password = "password123";
      const code = "secret_code";
      
      mockedAxios.post.mockResolvedValueOnce({
        data: { id: 1, username: "newuser" },
      });

      const result = await API.registerServer(serverUrl, username, password, code);

      expect(mockedAxios.post).toHaveBeenCalledWith(`${serverUrl}/auth/register`, {
        username,
        password,
        registrationCode: code,
      });
      expect(result).toEqual({ id: 1, username: "newuser" });
    });

    it("should throw a forbidden error if invitation code is wrong", async () => {
      const serverUrl = "http://localhost:3000";
      const username = "newuser";
      const password = "password123";
      const code = "wrong_code";

      const mockError = {
        isAxiosError: true,
        response: {
          status: 403,
        },
      };

      mockedAxios.isAxiosError.mockReturnValue(true);
      mockedAxios.post.mockRejectedValueOnce(mockError);

      await expect(API.registerServer(serverUrl, username, password, code)).rejects.toThrow(
        "Registration failed: Invalid or missing server invitation code"
      );
    });

    it("should throw a conflict error if username is taken", async () => {
      const serverUrl = "http://localhost:3000";
      const username = "existinguser";
      const password = "password123";

      const mockError = {
        isAxiosError: true,
        response: {
          status: 409,
        },
      };

      mockedAxios.isAxiosError.mockReturnValue(true);
      mockedAxios.post.mockRejectedValueOnce(mockError);

      await expect(API.registerServer(serverUrl, username, password)).rejects.toThrow(
        "Registration failed: Username already taken"
      );
    });

    it("should throw validation error messages from backend", async () => {
      const serverUrl = "http://localhost:3000";
      const username = "user";
      const password = "pw";

      const mockError = {
        isAxiosError: true,
        response: {
          status: 400,
          data: { message: ["Le mot de passe doit faire au moins 6 caractères"] },
        },
      };

      mockedAxios.isAxiosError.mockReturnValue(true);
      mockedAxios.post.mockRejectedValueOnce(mockError);

      await expect(API.registerServer(serverUrl, username, password)).rejects.toThrow(
        "Le mot de passe doit faire au moins 6 caractères"
      );
    });

    it("should throw validation string messages from backend", async () => {
      const serverUrl = "http://localhost:3000";
      const username = "user";
      const password = "pw";

      const mockError = {
        isAxiosError: true,
        response: {
          status: 400,
          data: { message: "Single message error" },
        },
      };

      mockedAxios.isAxiosError.mockReturnValue(true);
      mockedAxios.post.mockRejectedValueOnce(mockError);

      await expect(API.registerServer(serverUrl, username, password)).rejects.toThrow(
        "Single message error"
      );
    });

    it("should throw generic registration failure if axios error contains no message", async () => {
      const mockError = {
        isAxiosError: true,
        response: {
          status: 400,
          data: {},
        },
      };

      mockedAxios.isAxiosError.mockReturnValue(true);
      mockedAxios.post.mockRejectedValueOnce(mockError);

      await expect(API.registerServer("url", "usr", "pw")).rejects.toThrow(
        "Registration failed"
      );
    });

    it("should throw generic registration error if non-axios error occurs", async () => {
      mockedAxios.isAxiosError.mockReturnValue(false);
      mockedAxios.post.mockRejectedValueOnce(new Error("Network failed"));

      await expect(API.registerServer("url", "usr", "pw")).rejects.toThrow(
        "Registration failed"
      );
    });
  });

  describe("loginServer", () => {
    it("should successfully log in a user", async () => {
      const serverUrl = "http://localhost:3000";
      const username = "testuser";
      const password = "password123";
      
      const mockResponse = {
        access_token: "at",
        refresh_token: "rt",
      };

      mockedAxios.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await API.loginServer(serverUrl, username, password);

      expect(mockedAxios.post).toHaveBeenCalledWith(`${serverUrl}/auth/login`, {
        username,
        password,
      });
      expect(result).toEqual(mockResponse);
    });

    it("should throw invalid credentials error", async () => {
      const serverUrl = "http://localhost:3000";
      const username = "testuser";
      const password = "wrongpassword";

      const mockError = {
        isAxiosError: true,
        response: {
          status: 401,
        },
      };

      mockedAxios.isAxiosError.mockReturnValue(true);
      mockedAxios.post.mockRejectedValueOnce(mockError);

      await expect(API.loginServer(serverUrl, username, password)).rejects.toThrow(
        "Login failed, invalid credentials"
      );
    });

    it("should throw generic error for other login server failures", async () => {
      mockedAxios.isAxiosError.mockReturnValue(false);
      mockedAxios.post.mockRejectedValueOnce(new Error("Conn lost"));

      await expect(API.loginServer("url", "usr", "pw")).rejects.toThrow(
        "Login failed"
      );
    });
  });
});

describe("API Instance and Interceptors", () => {
  let api: API;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient.mockReset();
    mockClient.get.mockReset();
    mockClient.post.mockReset();
    mockClient.put.mockReset();
    mockClient.delete.mockReset();
    mockClient.patch.mockReset();
    mockedAxios.isAxiosError.mockReset();

    mockedAxios.create.mockReturnValue(mockClient as any);
    api = new API("http://localhost:3000");
  });

  describe("Interceptors", () => {
    it("should register request and response interceptors", () => {
      expect(mockClient.interceptors.request.use).toHaveBeenCalled();
      expect(mockClient.interceptors.response.use).toHaveBeenCalled();
      expect(requestInterceptor).toBeDefined();
      expect(responseInterceptorResolve).toBeDefined();
      expect(responseInterceptorReject).toBeDefined();
    });

    it("should handle request interceptor successfully", async () => {
      mockedStore.getState.mockReturnValue({
        servers: {
          accounts: {
            "http://localhost:3000": {
              accessToken: "mock_access_token",
              refreshToken: "mock_refresh_token",
            },
          },
        },
      });

      const configPost = {
        method: "post",
        url: "/protected/channels",
        headers: {} as any,
      };

      const resultPost = await requestInterceptor(configPost);
      expect(resultPost.headers["Content-Type"]).toBe("application/json");
      expect(resultPost.headers["Authorization"]).toBe("Bearer mock_access_token");

      const configRefresh = {
        method: "post",
        url: "/auth/refresh",
        headers: {} as any,
      };
      const resultRefresh = await requestInterceptor(configRefresh);
      expect(resultRefresh.headers["Authorization"]).toBe("Bearer mock_refresh_token");

      const configLogin = {
        method: "post",
        url: "/auth/login",
        headers: {} as any,
      };
      const resultLogin = await requestInterceptor(configLogin);
      expect(resultLogin.headers["Authorization"]).toBeUndefined();
    });

    it("should handle request interceptor when config method is missing", async () => {
      mockedStore.getState.mockReturnValue({ servers: { accounts: {} } });
      const config = { url: "/auth/login", headers: {} as any };
      const result = await requestInterceptor(config);
      expect(result.headers["Content-Type"]).toBeUndefined();
    });

    it("should handle request interceptor refresh when tokens are missing", async () => {
      mockedStore.getState.mockReturnValue({ servers: { accounts: {} } });
      const config = { method: "post", url: "/auth/refresh", headers: {} as any };
      const result = await requestInterceptor(config);
      expect(result.headers["Authorization"]).toBeUndefined();
    });

    it("should handle request interceptor protected when tokens are missing", async () => {
      mockedStore.getState.mockReturnValue({ servers: { accounts: {} } });
      const config = { method: "get", url: "/protected/channels", headers: {} as any };
      const result = await requestInterceptor(config);
      expect(result.headers["Authorization"]).toBeUndefined();
    });

    it("should handle response interceptor success", () => {
      const mockResponse = { data: "ok" };
      const result = responseInterceptorResolve(mockResponse);
      expect(result).toBe(mockResponse);
    });

    it("should handle response interceptor 401 error with successful refresh", async () => {
      mockedStore.getState.mockReturnValue({
        servers: {
          accounts: {
            "http://localhost:3000": {
              accessToken: "old_access",
              refreshToken: "old_refresh",
            },
          },
        },
      });

      const originalRequest = {
        _retry: false,
        url: "/protected/channels",
        headers: {} as any,
      };

      const error = {
        response: { status: 401 },
        config: originalRequest,
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          access_token: "new_access",
          refresh_token: "new_refresh",
        },
      });

      mockClient.mockResolvedValueOnce("retried_response");

      const result = await responseInterceptorReject(error);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        "http://localhost:3000/auth/refresh",
        {},
        { headers: { Authorization: "Bearer old_refresh" } }
      );
      expect(mockedStore.dispatch).toHaveBeenCalled();
      expect(result).toBe("retried_response");
    });

    it("should handle response interceptor 401 error with refresh failure", async () => {
      mockedStore.getState.mockReturnValue({
        servers: {
          accounts: {
            "http://localhost:3000": {
              accessToken: "old_access",
              refreshToken: "old_refresh",
            },
          },
        },
      });

      const originalRequest = {
        _retry: false,
        url: "/protected/channels",
        headers: {},
      };

      const error = {
        response: { status: 401 },
        config: originalRequest,
      };

      mockedAxios.post.mockRejectedValueOnce(new Error("Refresh failed"));

      await expect(responseInterceptorReject(error)).rejects.toThrow("Refresh failed");
      expect(mockedStore.dispatch).toHaveBeenCalled();
    });

    it("should reject 401 if refresh token is missing", async () => {
      mockedStore.getState.mockReturnValue({
        servers: { accounts: {} },
      });

      const originalRequest = {
        _retry: false,
        url: "/protected/channels",
        headers: {},
      };

      const error = {
        response: { status: 401 },
        config: originalRequest,
      };

      await expect(responseInterceptorReject(error)).rejects.toThrow("No refresh token available");
    });

    it("should reject error if not a 401", async () => {
      const error = {
        response: { status: 500 },
        config: {},
      };
      await expect(responseInterceptorReject(error)).rejects.toEqual(error);
    });
  });

  describe("Instance Methods", () => {
    describe("login", () => {
      it("should return token response on successful login", async () => {
        const mockResponse = { access_token: "at", refresh_token: "rt" };
        mockClient.post.mockResolvedValueOnce({ data: mockResponse });

        const result = await api.login("usr", "pw");
        expect(mockClient.post).toHaveBeenCalledWith("/auth/login", {
          username: "usr",
          password: "pw",
        });
        expect(result).toEqual(mockResponse);
      });

      it("should throw credentials error on 401", async () => {
        mockedAxios.isAxiosError.mockReturnValue(true);
        mockClient.post.mockRejectedValueOnce({ response: { status: 401 } });

        await expect(api.login("usr", "pw")).rejects.toThrow("Login failed, invalid credentials");
      });

      it("should throw generic error on other errors", async () => {
        mockedAxios.isAxiosError.mockReturnValue(false);
        mockClient.post.mockRejectedValueOnce(new Error("Generic"));

        await expect(api.login("usr", "pw")).rejects.toThrow("Login failed");
      });
    });

    describe("extendSession", () => {
      it("should successfully extend session", async () => {
        const mockResponse = { access_token: "at", refresh_token: "rt" };
        mockClient.post.mockResolvedValueOnce({ data: mockResponse });

        const result = await api.extendSession();
        expect(mockClient.post).toHaveBeenCalledWith("/auth/refresh", {});
        expect(result).toEqual(mockResponse);
      });

      it("should throw invalid token on 401", async () => {
        mockedAxios.isAxiosError.mockReturnValue(true);
        mockClient.post.mockRejectedValueOnce({ response: { status: 401 } });

        await expect(api.extendSession()).rejects.toThrow("Session extension failed, invalid token");
      });

      it("should throw generic error on other errors", async () => {
        mockedAxios.isAxiosError.mockReturnValue(false);
        mockClient.post.mockRejectedValueOnce(new Error("Failure"));

        await expect(api.extendSession()).rejects.toThrow("Session extension failed");
      });
    });

    describe("logout", () => {
      it("should call logout endpoint", async () => {
        mockClient.post.mockResolvedValueOnce({});
        await api.logout();
        expect(mockClient.post).toHaveBeenCalledWith("/auth/logout", {});
      });

      it("should handle error silently", async () => {
        mockClient.post.mockRejectedValueOnce(new Error("fail"));
        await expect(api.logout()).resolves.toBeUndefined();
      });
    });

    describe("getUserData", () => {
      it("should fetch users data in batch", async () => {
        const mockUsers = [{ username: "a" }];
        mockClient.post.mockResolvedValueOnce({ data: mockUsers });

        const result = await api.getUserData(["a"]);
        expect(mockClient.post).toHaveBeenCalledWith("/user/batch", { usernames: ["a"] });
        expect(result).toEqual(mockUsers);
      });

      it("should throw generic error on failure", async () => {
        mockClient.post.mockRejectedValueOnce("API error");
        await expect(api.getUserData(["a"])).rejects.toThrow("API error");
      });
    });

    describe("getMyProfile", () => {
      it("should fetch personal profile", async () => {
        const mockProfile = { username: "me" };
        mockClient.get.mockResolvedValueOnce({ data: mockProfile });

        const result = await api.getMyProfile();
        expect(mockClient.get).toHaveBeenCalledWith("/user/meta");
        expect(result).toEqual(mockProfile);
      });

      it("should throw generic error on failure", async () => {
        mockClient.get.mockRejectedValueOnce(new Error("meta fail"));
        await expect(api.getMyProfile()).rejects.toThrow("Failed to fetch my profile:");
      });
    });

    describe("postNewUserData", () => {
      it("should update personal profile data", async () => {
        const mockProfile = { username: "newName" };
        mockClient.patch.mockResolvedValueOnce({ data: mockProfile });

        const result = await api.postNewUserData({ username: "newName" });
        expect(mockClient.patch).toHaveBeenCalledWith("/user/meta", { username: "newName" });
        expect(result).toEqual(mockProfile);
      });

      it("should throw invalid token error on 401", async () => {
        mockedAxios.isAxiosError.mockReturnValue(true);
        mockClient.patch.mockRejectedValueOnce({ response: { status: 401 } });

        await expect(api.postNewUserData({ username: "n" })).rejects.toThrow(
          "User data modification failed, invalid token"
        );
      });

      it("should throw generic modification error on other failure", async () => {
        mockedAxios.isAxiosError.mockReturnValue(false);
        mockClient.patch.mockRejectedValueOnce(new Error("other"));

        await expect(api.postNewUserData({ username: "n" })).rejects.toThrow(
          "User data modification failed"
        );
      });
    });

    describe("postPushToken", () => {
      it("should post push token successfully", async () => {
        mockClient.post.mockResolvedValueOnce({});
        await api.postPushToken("tok");
        expect(mockClient.post).toHaveBeenCalledWith("/user/push-token", { token: "tok" });
      });

      it("should throw invalid session error on 401", async () => {
        mockedAxios.isAxiosError.mockReturnValue(true);
        mockClient.post.mockRejectedValueOnce({ response: { status: 401 } });

        await expect(api.postPushToken("tok")).rejects.toThrow(
          "Push token registration failed, invalid session token"
        );
      });

      it("should throw generic push token error on failure", async () => {
        mockedAxios.isAxiosError.mockReturnValue(false);
        mockClient.post.mockRejectedValueOnce(new Error("fail"));

        await expect(api.postPushToken("tok")).rejects.toThrow("Push token registration failed:");
      });
    });

    describe("removePushToken", () => {
      it("should remove push token", async () => {
        mockClient.delete.mockResolvedValueOnce({});
        await api.removePushToken("tok");
        expect(mockClient.delete).toHaveBeenCalledWith("/user/push-token", { data: { token: "tok" } });
      });

      it("should log error on failure", async () => {
        mockClient.delete.mockRejectedValueOnce(new Error("del fail"));
        await expect(api.removePushToken("tok")).resolves.toBeUndefined();
      });
    });

    describe("createNewChannel", () => {
      const newChannel = { name: "ch", img: "img" };

      it("should return new channel ID on success", async () => {
        mockClient.post.mockResolvedValueOnce({ data: 42 });
        const result = await api.createNewChannel(newChannel);
        expect(mockClient.post).toHaveBeenCalledWith("/protected/channels", newChannel);
        expect(result).toBe(42);
      });

      it("should throw invalid token on 401", async () => {
        mockedAxios.isAxiosError.mockReturnValue(true);
        mockClient.post.mockRejectedValueOnce({ response: { status: 401 } });
        await expect(api.createNewChannel(newChannel)).rejects.toThrow("Channel creation failed, invalid token");
      });

      it("should throw channel name taken on 409", async () => {
        mockedAxios.isAxiosError.mockReturnValue(true);
        mockClient.post.mockRejectedValueOnce({ response: { status: 409 } });
        await expect(api.createNewChannel(newChannel)).rejects.toThrow("Channel name already taken");
      });

      it("should throw generic channel creation error on failure", async () => {
        mockedAxios.isAxiosError.mockReturnValue(false);
        mockClient.post.mockRejectedValueOnce(new Error("fail"));
        await expect(api.createNewChannel(newChannel)).rejects.toThrow("Channel creation failed");
      });
    });

    describe("deleteChannel", () => {
      it("should delete channel successfully", async () => {
        mockClient.delete.mockResolvedValueOnce({});
        const result = await api.deleteChannel(1);
        expect(mockClient.delete).toHaveBeenCalledWith("/protected/channels/1");
        expect(result).toBe("deleted");
      });

      it("should throw invalid token on 401", async () => {
        mockedAxios.isAxiosError.mockReturnValue(true);
        mockClient.delete.mockRejectedValueOnce({ response: { status: 401 } });
        await expect(api.deleteChannel(1)).rejects.toThrow("Channel deletion failed, invalid token");
      });

      it("should throw generic channel deletion error on failure", async () => {
        mockedAxios.isAxiosError.mockReturnValue(false);
        mockClient.delete.mockRejectedValueOnce(new Error("fail"));
        await expect(api.deleteChannel(1)).rejects.toThrow("Channel deletion failed");
      });
    });

    describe("addUserToChannel", () => {
      it("should add user to channel", async () => {
        mockClient.put.mockResolvedValueOnce({});
        const result = await api.addUserToChannel(1, 10);
        expect(mockClient.put).toHaveBeenCalledWith("/protected/channels/1/user/10", {});
        expect(result).toBe("added");
      });

      it("should throw invalid token on 401", async () => {
        mockedAxios.isAxiosError.mockReturnValue(true);
        mockClient.put.mockRejectedValueOnce({ response: { status: 401 } });
        await expect(api.addUserToChannel(1, 10)).rejects.toThrow("Can't add user to channel, invalid token");
      });

      it("should throw generic error on other errors", async () => {
        mockedAxios.isAxiosError.mockReturnValue(false);
        mockClient.put.mockRejectedValueOnce(new Error("err"));
        await expect(api.addUserToChannel(1, 10)).rejects.toThrow("Can't add user to channel");
      });
    });

    describe("banUserFromChannel", () => {
      it("should ban/remove user", async () => {
        mockClient.delete.mockResolvedValueOnce({});
        const result = await api.banUserFromChannel(1, 10);
        expect(mockClient.delete).toHaveBeenCalledWith("/protected/channels/1/user/10");
        expect(result).toBe("removed");
      });

      it("should throw invalid token on 401", async () => {
        mockedAxios.isAxiosError.mockReturnValue(true);
        mockClient.delete.mockRejectedValueOnce({ response: { status: 401 } });
        await expect(api.banUserFromChannel(1, 10)).rejects.toThrow("Can't remove user from channel, invalid token");
      });

      it("should throw generic error on other failures", async () => {
        mockedAxios.isAxiosError.mockReturnValue(false);
        mockClient.delete.mockRejectedValueOnce(new Error("err"));
        await expect(api.banUserFromChannel(1, 10)).rejects.toThrow("Can't remove user from channel");
      });
    });

    describe("updateChannel", () => {
      const updateData = {
        name: "ch-updated",
        img: "img",
        theme: {
          primary_color: "c1",
          primary_color_dark: "c2",
          accent_color: "c3",
          text_color: "c4",
          accent_text_color: "c5",
        },
      };

      it("should update channel metadata successfully", async () => {
        mockClient.put.mockResolvedValueOnce({});
        const result = await api.updateChannel(1, updateData);
        expect(mockClient.put).toHaveBeenCalledWith("/protected/channels/1/update_metadata", updateData);
        expect(result).toBe("updated");
      });

      it("should throw unauthorized/permission error on 401", async () => {
        mockedAxios.isAxiosError.mockReturnValue(true);
        mockClient.put.mockRejectedValueOnce({ response: { status: 401 } });
        await expect(api.updateChannel(1, updateData)).rejects.toThrow(
          "Can't update channel, you don't have permissions to perform this action"
        );
      });

      it("should throw generic update error on failure", async () => {
        mockedAxios.isAxiosError.mockReturnValue(false);
        mockClient.put.mockRejectedValueOnce(new Error("err"));
        await expect(api.updateChannel(1, updateData)).rejects.toThrow("Can't update channel");
      });
    });

    describe("getChannels", () => {
      it("should get channel list", async () => {
        const mockChannels = [{ id: 1, name: "general" }];
        mockClient.get.mockResolvedValueOnce({ data: mockChannels });

        const result = await api.getChannels();
        expect(mockClient.get).toHaveBeenCalledWith("/protected/channels");
        expect(result).toEqual(mockChannels);
      });

      it("should throw invalid token on 401", async () => {
        mockedAxios.isAxiosError.mockReturnValue(true);
        mockClient.get.mockRejectedValueOnce({ response: { status: 401 } });
        await expect(api.getChannels()).rejects.toThrow("Can't get channels, invalid token");
      });

      it("should throw generic error on failure", async () => {
        mockedAxios.isAxiosError.mockReturnValue(false);
        mockClient.get.mockRejectedValueOnce(new Error("err"));
        await expect(api.getChannels()).rejects.toThrow("Can't get channels :");
      });
    });

    describe("getMessages", () => {
      it("should get message list with skips and takes", async () => {
        const mockMessages = [{ id: 1, content: "hi" }];
        mockClient.get.mockResolvedValueOnce({ data: mockMessages });

        const result = await api.getMessages(1, 40);
        expect(mockClient.get).toHaveBeenCalledWith("/protected/channels/1/messages", {
          params: { skip: 40, take: 40 },
        });
        expect(result).toEqual(mockMessages);
      });

      it("should throw unauthorized error on 401", async () => {
        mockedAxios.isAxiosError.mockReturnValue(true);
        mockClient.get.mockRejectedValueOnce({ response: { status: 401 } });
        await expect(api.getMessages(1, 40)).rejects.toThrow(
          "Can't get messages, user does not have permission to use this channel"
        );
      });

      it("should throw generic error on failure", async () => {
        mockedAxios.isAxiosError.mockReturnValue(false);
        mockClient.get.mockRejectedValueOnce(new Error("err"));
        await expect(api.getMessages(1, 40)).rejects.toThrow("Can't get messages");
      });
    });

    describe("sendMessage", () => {
      const msg = { type: "Text", content: "hello" };

      it("should send message successfully", async () => {
        mockClient.post.mockResolvedValueOnce({});
        const result = await api.sendMessage(1, msg);
        expect(mockClient.post).toHaveBeenCalledWith("/protected/channels/1/messages", msg);
        expect(result).toBe("sent");
      });

      it("should throw unauthorized error on 401", async () => {
        mockedAxios.isAxiosError.mockReturnValue(true);
        mockClient.post.mockRejectedValueOnce({ response: { status: 401 } });
        await expect(api.sendMessage(1, msg)).rejects.toThrow(
          "Can't send message, user does not have permission to use this channel"
        );
      });

      it("should throw bad request message on 400", async () => {
        mockedAxios.isAxiosError.mockReturnValue(true);
        mockClient.post.mockRejectedValueOnce({ response: { status: 400 } });
        await expect(api.sendMessage(1, msg)).rejects.toThrow("please let me log");
      });

      it("should throw generic message send error on other failure", async () => {
        mockedAxios.isAxiosError.mockReturnValue(false);
        mockClient.post.mockRejectedValueOnce(new Error("err"));
        await expect(api.sendMessage(1, msg)).rejects.toThrow("Can't send message:");
      });
    });

    describe("uploadImage", () => {
      it("should upload image successfully", async () => {
        mockClient.post.mockResolvedValueOnce({ data: { url: "img_url" } });
        const result = await api.uploadImage("file_blob");
        expect(mockClient.post).toHaveBeenCalledWith("/protected/uploads/image", expect.any(FormData), {
          headers: { "Content-Type": "multipart/form-data" },
        });
        expect(result).toEqual({ url: "img_url" });
      });

      it("should throw unauthorized error on 401", async () => {
        mockedAxios.isAxiosError.mockReturnValue(true);
        mockClient.post.mockRejectedValueOnce({ response: { status: 401 } });
        await expect(api.uploadImage("file_blob")).rejects.toThrow(
          "Can't upload image, user does not have permission to use this channel"
        );
      });

      it("should throw generic upload error on other failures", async () => {
        mockedAxios.isAxiosError.mockReturnValue(false);
        mockClient.post.mockRejectedValueOnce(new Error("err"));
        await expect(api.uploadImage("file_blob")).rejects.toThrow("Can't upload image:");
      });
    });
  });
});
