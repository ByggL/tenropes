import {
  ChannelMetadata,
  ChannelUpdateMetadata,
  ExtendSessionResponse,
  LoginResponse,
  ModifiedMessageMetadata,
  NewChannelData,
  NewMessageData,
  UserMetadata,
} from "@/types/types";
import axios, { AxiosInstance, isAxiosError } from "axios";

// Make sure this path points to where you actually create your Redux store
import { store } from "../store";
import { markSessionExpired, updateTokens } from "../store/serversSlice";

export class API {
  private readonly client: AxiosInstance;
  public serverUrl: string;

  constructor(serverUrl: string) {
    this.serverUrl = serverUrl;
    this.client = axios.create({
      baseURL: this.serverUrl,
    });

    this.client.interceptors.request.use(async (config) => {
      const methodsWithBody = ["post", "put", "patch"];
      if (config.method && methodsWithBody.includes(config.method)) {
        config.headers["Content-Type"] = "application/json";
      }

      // Fetch tokens directly from Redux for THIS specific server URL
      const state = store.getState();
      const account = state.servers?.accounts?.[this.serverUrl];

      if (config.url?.includes("/auth/refresh")) {
        if (account?.refreshToken) {
          config.headers.Authorization = `Bearer ${account.refreshToken}`;
        }
      } else if (
        config.url?.includes("/protected/") ||
        config.url?.includes("/user") ||
        config.url?.includes("/auth/logout")
      ) {
        if (account?.accessToken) {
          config.headers.Authorization = `Bearer ${account.accessToken}`;
        }
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes("/auth/login")) {
          originalRequest._retry = true;

          try {
            const state = store.getState();
            const account = state.servers?.accounts?.[this.serverUrl];

            if (!account?.refreshToken) throw new Error("No refresh token available");

            // Bypass interceptors for the refresh request to avoid loops
            const refreshResponse = await axios.post<ExtendSessionResponse>(
              `${this.serverUrl}/auth/refresh`,
              {},
              { headers: { Authorization: `Bearer ${account.refreshToken}` } },
            );

            const newTokens = {
              accessToken: refreshResponse.data.access_token,
              refreshToken: refreshResponse.data.refresh_token,
            };

            // Dispatch the new tokens to Redux directly
            store.dispatch(
              updateTokens({
                serverId: this.serverUrl,
                ...newTokens,
              }),
            );

            // Retry original request
            originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            // If refresh fails, kill the session in Redux
            store.dispatch(markSessionExpired(this.serverUrl));
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      },
    );
  }

  // --- Static login helper for the Add Server Modal ---
  public static async loginServer(serverUrl: string, username: string, password: string): Promise<LoginResponse> {
    try {
      const response = await axios.post<LoginResponse>(`${serverUrl}/auth/login`, {
        username,
        password,
      });
      return response.data;
    } catch (error: any) {
      if (isAxiosError(error) && error.response?.status === 401) {
        throw new Error("Login failed, invalid credentials");
      }
      throw new Error("Login failed");
    }
  }

  ///////////////////////////////////////
  //////////// AUTH REQUESTS ////////////
  ///////////////////////////////////////

  public async login(username: string, password: string): Promise<LoginResponse> {
    try {
      const response = await this.client.post<LoginResponse>("/auth/login", {
        username,
        password,
      });

      console.log("Login successful");
      return response.data;
    } catch (error: any) {
      console.error("Login Error details:", error.response?.data || error.message || error);
      if (isAxiosError(error) && error.response?.status === 401) {
        throw new Error("Login failed, invalid credentials");
      }
      throw new Error("Login failed");
    }
  }

  public async extendSession(): Promise<ExtendSessionResponse> {
    try {
      const response = await this.client.post<ExtendSessionResponse>("/auth/refresh", {});

      console.log("Session extension successful");
      return response.data;
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        throw new Error("Session extension failed, invalid token");
      }
      console.log("?");

      throw new Error("Session extension failed");
    }
  }

  public async logout(): Promise<void> {
    try {
      await this.client.post("/auth/logout", {});
    } catch (error) {
      console.error("Logout failed", error);
    }
  }

  ///////////////////////////////////////
  //////////// USER REQUESTS ////////////
  ///////////////////////////////////////

  public async getUserData(users: string[]): Promise<UserMetadata[]> {
    try {
      const response = await this.client.post<UserMetadata[]>("/user/batch", {
        usernames: users,
      });

      console.log("Retrieved users data successfully");
      return response.data;
    } catch (error) {
      throw new Error(error as string);
    }
  }

  public async getMyProfile(): Promise<UserMetadata> {
    try {
      const response = await this.client.get<UserMetadata>("/user/meta");

      console.log("Retrieved personal profile");
      return response.data;
    } catch (error) {
      throw new Error("Failed to fetch my profile: " + error);
    }
  }

  public async postNewUserData(newUserData: { username: string }): Promise<UserMetadata> {
    try {
      const response = await this.client.patch<UserMetadata>("/user/meta", newUserData);
      console.log("User data modification successful");
      console.log(response.data);
      return response.data;
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        throw new Error("User data modification failed, invalid token");
      }
      throw new Error("User data modification failed");
    }
  }

  //////////////////////////////////////////
  //////////// CHANNEL REQUESTS ////////////
  //////////////////////////////////////////

  public async createNewChannel(newChannelData: NewChannelData): Promise<number> {
    try {
      const response = await this.client.post<number>("/protected/channels", newChannelData);
      console.log("Channel creation successful");
      return response.data;
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        throw new Error("Channel creation failed, invalid token");
      }
      if (isAxiosError(error) && error.response?.status === 409) {
        throw new Error("Channel name already taken");
      }
      throw new Error("Channel creation failed");
    }
  }

  public async deleteChannel(channelId: number): Promise<string> {
    try {
      await this.client.delete(`/protected/channels/${channelId}`);
      console.log("Channel deletion successful");
      return "deleted";
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        throw new Error("Channel deletion failed, invalid token");
      }
      throw new Error("Channel deletion failed");
    }
  }

  public async addUserToChannel(channelId: number, userId: string | number): Promise<string> {
    try {
      await this.client.put(`/protected/channels/${channelId}/user/${userId}`, {});
      console.log("User added to channel");
      return "added";
    } catch (error) {
      console.error(error);
      if (isAxiosError(error) && error.response?.status === 401) {
        throw new Error("Can't add user to channel, invalid token");
      }
      throw new Error("Can't add user to channel");
    }
  }

  public async banUserFromChannel(channelId: number, userId: string | number): Promise<string> {
    try {
      await this.client.delete(`/protected/channels/${channelId}/user/${userId}`);
      console.log("User removed from channel");
      return "removed";
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        throw new Error("Can't remove user from channel, invalid token");
      }
      throw new Error("Can't remove user from channel");
    }
  }

  public async updateChannel(channelId: number, newChannelData: ChannelUpdateMetadata): Promise<string> {
    try {
      await this.client.put(`/protected/channels/${channelId}/update_metadata`, newChannelData);
      console.log("Channel updated");
      return "updated";
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        throw new Error("Can't update channel, you don't have permissions to perform this action");
      }
      throw new Error("Can't update channel");
    }
  }

  public async getChannels(): Promise<ChannelMetadata[]> {
    try {
      const response = await this.client.get<ChannelMetadata[]>(`/protected/channels`);
      console.log("Channels retrieved");
      return response.data;
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        throw new Error("Can't get channels, invalid token");
      }
      throw new Error(`Can't get channels : ${error}`);
    }
  }

  ///////////////////////////////////////////
  //////////// MESSAGES REQUESTS ////////////
  ///////////////////////////////////////////

  public async getMessages(channelId: number, batchOffset: number): Promise<ModifiedMessageMetadata[]> {
    try {
      const response = await this.client.get<ModifiedMessageMetadata[]>(`/protected/channels/${channelId}/messages`);
      console.log("Messages retrieved");
      return response.data;
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        throw new Error("Can't get messages, user does not have permission to use this channel");
      }
      throw new Error("Can't get messages");
    }
  }

  public async sendMessage(channelId: number, newMessage: NewMessageData): Promise<string> {
    try {
      console.log(newMessage);
      await this.client.post(`/protected/channels/${channelId}/messages`, newMessage);
      console.log("Message sent");
      return "sent";
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        throw new Error("Can't send message, user does not have permission to use this channel");
      } else if (isAxiosError(error) && error.response?.status === 400) {
        throw new Error("please let me log");
      }
      throw new Error("Can't send message: " + error);
    }
  }

  public async uploadImage(imageFile: File | Blob): Promise<string> {
    try {
      const formData = new FormData();

      formData.append("file", imageFile);

      const response = await this.client.post<string>(`/protected/uploads/image`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("Image uploaded");

      return response.data;
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        throw new Error("Can't upload image, user does not have permission to use this channel");
      }
      throw new Error("Can't upload image: " + error);
    }
  }
}
