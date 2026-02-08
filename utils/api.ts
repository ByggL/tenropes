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
import axios, { AxiosInstance } from "axios";
import { getJwt, storeJwt } from "./jwt";

class API {
  private readonly client: AxiosInstance;
  // Ensure this matches your NestJS main.ts port (usually 3000)
  private readonly baseUrl = "http://192.168.1.155:3000";

  public jwtToken: string = "";

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

      const token = await getJwt();
      if (token) this.jwtToken = token.token;

      // Add auth token for protected routes AND user routes
      // The backend protects /user and /protected/channels
      if (
        config.url?.includes("/protected/") ||
        config.url?.includes("/user") ||
        config.url?.includes("/auth/refresh")
      ) {
        if (token) {
          // console.log(token.token);
          config.headers.Authorization = `Bearer ${token.token}`;

          // Note: For /auth/refresh, your backend strategy likely requires
          // the Refresh Token in the Authorization header.
          // If your 'token' object has a specific refreshToken property, use that instead:
          // if (config.url.includes("/auth/refresh")) {
          //    config.headers.Authorization = `Bearer ${token.refreshToken}`;
          // }
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
    password: string,
  ): Promise<LoginResponse> {
    try {
      // Backend: AuthController @Post('login')
      const response = await this.client.post<LoginResponse>("/auth/login", {
        username,
        password,
      });

      console.log("Login successful");
      const { data } = response;
      this.jwtToken = data.access_token;
      await storeJwt(data.access_token);
      return data;
    } catch (error: any) {
      console.error(
        "Login Error details:",
        error.response?.data || error.message || error,
      );
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        throw new Error("Login failed, invalid credentials");
      }
      throw new Error("Login failed");
    }
  }

  public async extendSession(): Promise<ExtendSessionResponse> {
    try {
      // Backend: AuthController @Post('refresh')
      // Note: Make sure your interceptor sends the correct Refresh Token for this endpoint
      const response = await this.client.post<ExtendSessionResponse>(
        "/auth/refresh",
        {},
      );

      console.log("Session extension successful");
      const { data } = response;
      await storeJwt(data.access_token);
      return data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        throw new Error("Session extension failed, invalid token");
      }
      throw new Error("Session extension failed");
    }
  }

  ///////////////////////////////////////
  //////////// USER REQUESTS ////////////
  ///////////////////////////////////////

  // Note: The backend UsersController only exposes methods for the CURRENT user (@Req() req).
  // It does not seem to support fetching a list of other users by ID array yet.
  public async getUserData(users: string[]): Promise<UserMetadata[]> {
    try {
      // Backend: UsersController @Get('meta') -> Returns single user profile
      // Current implementation fetches the logged-in user's profile.
      // If you need other users, you must update UsersController.
      const url = `/user/meta`;
      const response = await this.client.get<UserMetadata | UserMetadata[]>(
        url,
      );

      console.log("Retrieved user data");
      // Adapting response to array for compatibility
      return Array.isArray(response.data) ? response.data : [response.data];
    } catch (error) {
      throw new Error(error as string);
    }
  }

  public async postNewUserData(newUserData: {
    username: string;
  }): Promise<UserMetadata> {
    try {
      // Backend: UsersController @Patch('meta')
      const response = await this.client.patch<UserMetadata>(
        "/user/meta",
        newUserData,
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

  /* // NOT IMPLEMENTED IN BACKEND: UsersController
  public async postPushToken(pushTokenString: String) {
     ...
  } 
  */

  //////////////////////////////////////////
  //////////// CHANNEL REQUESTS ////////////
  //////////////////////////////////////////

  public async createNewChannel(
    newChannelData: NewChannelData,
  ): Promise<number> {
    try {
      // Backend: ChannelsController @Post() -> path /protected/channels
      const response = await this.client.post<number>(
        "/protected/channels",
        newChannelData,
      );
      console.log("Channel creation successful");
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        throw new Error("Channel creation failed, invalid token");
      }
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        throw new Error("Channel name already taken");
      }
      throw new Error("Channel creation failed");
    }
  }

  public async deleteChannel(channelId: number): Promise<string> {
    try {
      // Backend: ChannelsController @Delete(':channel_id')
      await this.client.delete(`/protected/channels/${channelId}`);
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
    userId: string | number,
  ): Promise<string> {
    try {
      // Backend: ChannelsController @Put(':channel_id/user/:user_id')
      await this.client.put(
        `/protected/channels/${channelId}/user/${userId}`,
        {},
      );
      console.log("User added to channel");
      return "added";
    } catch (error) {
      console.error(error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        throw new Error("Can't add user to channel, invalid token");
      }
      throw new Error("Can't add user to channel");
    }
  }

  public async banUserFromChannel(
    channelId: number,
    userId: string | number,
  ): Promise<string> {
    try {
      // Backend: ChannelsController @Delete(':channel_id/user/:user_id')
      await this.client.delete(
        `/protected/channels/${channelId}/user/${userId}`,
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
    newChannelData: ChannelUpdateMetadata,
  ): Promise<string> {
    try {
      // Backend: ChannelsController @Put(':channel_id/update_metadata')
      await this.client.put(
        `/protected/channels/${channelId}/update_metadata`,
        newChannelData,
      );
      console.log("Channel updated");
      return "updated";
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        throw new Error(
          "Can't update channel, you don't have permissions to perform this action",
        );
      }
      throw new Error("Can't update channel");
    }
  }

  public async getChannels(): Promise<ChannelMetadata[]> {
    try {
      // Backend: ChannelsController @Get() -> path /protected/channels
      const response =
        await this.client.get<ChannelMetadata[]>(`/protected/channels`);
      console.log("Channels retrieved");
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        throw new Error("Can't get channels, invalid token");
      }
      throw new Error(`Can't get channels : ${error}`);
    }
  }

  /*
  // NOT IMPLEMENTED IN BACKEND: ChannelsController
  public async createInvite(channelId: number): Promise<string> { ... }
  public async useInvite(UUID: String): Promise<String> { ... }
  */

  ///////////////////////////////////////////
  //////////// MESSAGES REQUESTS ////////////
  ///////////////////////////////////////////

  public async getMessages(
    channelId: number,
    batchOffset: number,
  ): Promise<ModifiedMessageMetadata[]> {
    try {
      // Backend: ChannelsController @Get(':channel_id/messages')
      // NOTE: The current backend controller does NOT accept 'batchOffset'.
      // It returns the full history. You need to update the backend to support pagination.
      const response = await this.client.get<ModifiedMessageMetadata[]>(
        `/protected/channels/${channelId}/messages`,
      );
      console.log("Messages retrieved");
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        throw new Error(
          "Can't get messages, user does not have permission to use this channel",
        );
      }
      throw new Error("Can't get messages");
    }
  }

  public async sendMessage(
    channelId: number,
    newMessage: NewMessageData,
  ): Promise<string> {
    try {
      // Backend: ChannelsController @Post(':channel_id/messages')
      // Note the plural 'messages' in the path
      console.log(newMessage);
      await this.client.post(
        `/protected/channels/${channelId}/messages`,
        newMessage,
      );
      console.log("Message sent");
      return "sent";
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        throw new Error(
          "Can't send message, user does not have permission to use this channel",
        );
      } else if (axios.isAxiosError(error) && error.response?.status === 400) {
        throw new Error("please let me log");
      }
      throw new Error("Can't send message: " + error);
    }
  }

  /*
  // NOT IMPLEMENTED IN BACKEND: ChannelsController (No moderate/update message endpoint)
  public async updateMessage(channelId: number, messageUpdate: MessageMetadata): Promise<string> { ... }
  */
}

export default new API();
