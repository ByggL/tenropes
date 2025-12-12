import {
  ChannelMetadata,
  ChannelUpdateMetadata,
  ExtendSessionResponse,
  LoginResponse,
  MessageMetadata,
  NewChannelData,
  NewMessageData,
  UserMetadata,
} from "@/types/api_types";
import axios, { AxiosInstance } from "axios";
import { getJwt, storeJwt } from "./jwt";

class API {
  private readonly client: AxiosInstance;
  private readonly baseUrl = "https://edu.tardigrade.land/msg";

  constructor() {
    this.client = axios.create({
      baseURL: this.baseUrl,
    });

    this.client.interceptors.request.use(async (config) => {
      // Set content type for requests with a body
      const methodsWithBody = ["post", "put", "patch"];
      if (config.method && methodsWithBody.includes(config.method)) {
        config.headers["Content-Type"] = "application/json";
      }

      // Only add auth token for protected routes
      if (config.url?.includes("/protected/")) {
        const token = await getJwt();
        if (token) {
          config.headers.Authorization = `Bearer ${token.token}`;
        }
      }
      return config;
    });
  }

  ///////////////////////////////////////
  //////////// AUTH REQUESTS ////////////
  ///////////////////////////////////////

  public async login(
    username: string,
    password: string
  ): Promise<LoginResponse> {
    try {
      const response = await this.client.post<LoginResponse>("/login", {
        username,
        password,
      });

      console.log("Login successful");
      const { data } = response;
      await storeJwt(data.token);
      return data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        throw new Error("Login failed, invalid credentials");
      }
      throw new Error("Login failed");
    }
  }

  public async extendSession(): Promise<ExtendSessionResponse> {
    try {
      const response = await this.client.post<ExtendSessionResponse>(
        "/protected/extend_session",
        {} // Empty body
      );

      console.log("Session extension successful");
      const { data } = response;
      // Store the newly received token
      await storeJwt(data.token);
      return data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        throw new Error("Session extension failed, invalid token");
      }
      throw new Error("Session extension failed");
    }
  }

  ///////////////////////////////////////

  ///////////////////////////////////////
  //////////// USER REQUESTS ////////////
  ///////////////////////////////////////
  public async getUserData(users: string): Promise<UserMetadata> {
    try {
      const url = `/protected/user/meta?users=${users}`;
      const response = await this.client.get<UserMetadata>(url, {});
      console.log("Retrieved user data");
      return response.data;
    } catch (error) {
      throw new Error(error as string);
    }
  }

  public async postNewUserData(
    newUserData: UserMetadata
  ): Promise<UserMetadata> {
    try {
      const response = await this.client.post<UserMetadata>(
        "/protected/user/meta",
        newUserData
      );
      console.log("User data modification successful");
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        throw new Error("User data modification failed, invalid token");
      }
      throw new Error("User data modification failed");
    }
  }

  ///////////////////////////////////////

  //////////////////////////////////////////
  //////////// CHANNEL REQUESTS ////////////
  //////////////////////////////////////////
  public async createNewChannel(
    newChannelData: NewChannelData
  ): Promise<number> {
    try {
      const response = await this.client.post<number>(
        "/protected/channel",
        newChannelData
      );
      console.log("Channel creation successful");
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        throw new Error("Channel creation failed, invalid token");
      }
      throw new Error("Channel creation failed");
    }
  }

  public async deleteChannel(channelId: number): Promise<string> {
    try {
      await this.client.delete(`/protected/channel/${channelId}`);
      console.log("Channel deletion successful");
      return "deleted";
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        throw new Error("Channel deletion failed, invalid token");
      }
      throw new Error("Channel deletion failed");
    }
  }

  public async addUserToChannel(
    channelId: number,
    userId: string
  ): Promise<string> {
    try {
      await this.client.put(
        `/protected/channel/${channelId}/user/${userId}`,
        {}
      );
      console.log("User added to channel");
      return "added";
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        throw new Error("Can't add user to channel, invalid token");
      }
      throw new Error("Can't add user to channel");
    }
  }

  public async banUserFromChannel(
    channelId: number,
    userId: string
  ): Promise<string> {
    try {
      await this.client.delete(
        `/protected/channel/${channelId}/user/${userId}`
      );
      console.log("User removed from channel");
      return "removed";
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        throw new Error("Can't remove user from channel, invalid token");
      }
      throw new Error("Can't remove user from channel");
    }
  }

  public async updateChannel(
    channelId: number,
    newChannelData: ChannelUpdateMetadata
  ): Promise<string> {
    try {
      await this.client.put(
        `/protected/channel/${channelId}/update_metadata`,
        newChannelData
      );
      console.log("Channel updated");
      return "updated";
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        throw new Error(
          "Can't update channel, you don't have permissions to perform this action"
        );
      }
      throw new Error("Can't update channel");
    }
  }

  public async getChannels(): Promise<ChannelMetadata[]> {
    try {
      const response = await this.client.get<ChannelMetadata[]>(
        `/protected/user/channels`
      );
      console.log("Channels retrieved");
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        throw new Error("Can't get channels, invalid token");
      }
      throw new Error("Can't get channels");
    }
  }

  ///////////////////////////////////////

  ///////////////////////////////////////////
  //////////// MESSAGES REQUESTS ////////////
  ///////////////////////////////////////////

  public async getMessages(
    channelId: number,
    batchOffset: number
  ): Promise<MessageMetadata[]> {
    try {
      const response = await this.client.get<MessageMetadata[]>(
        `/protected/channel/${channelId}/messages/${batchOffset}`
      );
      console.log("Messages retrieved");
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        throw new Error(
          "Can't get messages, user does not have permission to use this channel"
        );
      }
      throw new Error("Can't get messages");
    }
  }

  public async sendMessage(
    channelId: number,
    newMessage: NewMessageData
  ): Promise<string> {
    try {
      await this.client.post(
        `/protected/channel/${channelId}/message`,
        newMessage
      );
      console.log("Message sent");
      return "sent";
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        throw new Error(
          "Can't send message, user does not have permission to use this channel"
        );
      }
      throw new Error("Can't send message");
    }
  }

  public async updateMessage(
    channelId: number,
    messageUpdate: MessageMetadata
  ): Promise<string> {
    try {
      await this.client.post(
        `/protected/channel/${channelId}/message/moderate`,
        messageUpdate
      );
      console.log("Message updated");
      return "updated";
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        throw new Error(
          "Can't moderate message, user does not have permission to use this channel"
        );
      }
      throw new Error("Can't moderate message");
    }
  }
}

export default new API();
