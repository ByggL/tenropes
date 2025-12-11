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
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const storeJwt = async (jwtString: string) => {
  try {
    await AsyncStorage.setItem("jwt_token", jwtString);
  } catch (e) {
    throw new Error("Failed to store JWT token");
  }
};

const getJwt = async () => {
  try {
    const value = await AsyncStorage.getItem("jwt_token");
    if (value !== null) {
      return value;
    }
  } catch (e) {
    throw new Error("Failed ton retrieve JWT token");
  }
};

module.exports = {
  ///////////////////////////////////////
  //////////// AUTH REQUESTS ////////////
  ///////////////////////////////////////

  login: async (username: string, password: string): Promise<LoginResponse> => {
    let response = await axios.post(
      "https://edu.tardigrade.land/msg/login",
      {
        username: username,
        password: password,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status == 403) {
      throw new Error("Login failed, invalid credentials");
    } else if (response.status !== 200) {
      throw new Error("Login failed");
    }

    if (response.status === 200) {
      console.log("Login successful");
    }

    let data: LoginResponse = response.data;

    await storeJwt(data.token);

    return data;
  },

  extendSession: async (): Promise<ExtendSessionResponse> => {
    let jwtToken = await getJwt();

    let response = await axios.post(
      "https://edu.tardigrade.land/msg/protected/extend_session",
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );

    if (response.status == 401) {
      throw new Error("Session extension failed, invalid token");
    } else if (response.status !== 200) {
      throw new Error("Session extension failed");
    }

    if (response.status === 200) {
      console.log("Session extension successful");
    }

    let data: ExtendSessionResponse = response.data;

    return data;
  },

  ///////////////////////////////////////

  ///////////////////////////////////////
  //////////// USER REQUESTS ////////////
  ///////////////////////////////////////
  getUserData: async (): Promise<UserMetadata> => {
    let jwtToken = await getJwt();

    let response = await axios.post(
      "https://edu.tardigrade.land/msg/protected/user/meta",
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );

    if (response.status !== 200) {
      throw new Error("Can't retrieve user data");
    }

    if (response.status === 200) {
      console.log("Retrieved user data");
    }

    let data: UserMetadata = response.data;

    return data;
  },

  postNewUserData: async (newUserData: UserMetadata): Promise<UserMetadata> => {
    let jwtToken = await getJwt();

    let response = await axios.post(
      "https://edu.tardigrade.land/msg/protected/user/meta",
      newUserData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );

    if (response.status == 401) {
      throw new Error("User data modification failed, invalid token");
    } else if (response.status !== 200) {
      throw new Error("User data modification failed");
    }

    if (response.status === 200) {
      console.log("User data modification successful");
    }

    let data: UserMetadata = response.data;

    return data;
  },

  ///////////////////////////////////////

  //////////////////////////////////////////
  //////////// CHANNEL REQUESTS ////////////
  //////////////////////////////////////////
  createNewChannel: async (newChannelData: NewChannelData): Promise<number> => {
    let jwtToken = await getJwt();

    let response = await axios.post(
      "https://edu.tardigrade.land/msg/protected/channel",
      newChannelData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );

    if (response.status == 401) {
      throw new Error("Cchannel creation failed, invalid token");
    } else if (response.status !== 200) {
      throw new Error("Channel creation failed");
    }

    if (response.status === 200) {
      console.log("Channel creation successful");
    }

    let newChannelId: number = response.data;

    return newChannelId;
  },

  deleteChannel: async (channeld: number): Promise<string> => {
    let jwtToken = await getJwt();

    let response = await axios.delete(
      `https://edu.tardigrade.land/msg/protected/channel/${channeld}`,
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );

    if (response.status == 401) {
      throw new Error("Channel deletetion failed, invalid token");
    } else if (response.status !== 200) {
      throw new Error("Channel deletetion failed");
    }

    if (response.status === 200) {
      console.log("Channel deletetion successful");
    }

    return "deleted";
  },

  addUserToChannel: async (
    channelId: number,
    userId: string
  ): Promise<string> => {
    let jwtToken = await getJwt();

    let response = await axios.put(
      `https://edu.tardigrade.land/msg/protected/channel/${channelId}/user/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );

    if (response.status == 401) {
      throw new Error("Can't add user to channel, invalid token");
    } else if (response.status !== 200) {
      throw new Error("Can't add user to channel");
    }

    if (response.status === 200) {
      console.log("User added to channel");
    }

    return "added";
  },

  banUserFromChannel: async (
    channelId: number,
    userId: string
  ): Promise<string> => {
    let jwtToken = await getJwt();

    let response = await axios.delete(
      `https://edu.tardigrade.land/msg/protected/channel/${channelId}/user/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );

    if (response.status == 401) {
      throw new Error("Can't remove user from channel, invalid token");
    } else if (response.status !== 200) {
      throw new Error("Can't remove user from channel");
    }

    if (response.status === 200) {
      console.log("User removed from channel");
    }

    return "removed";
  },

  updateChannel: async (
    channelId: number,
    newChannelData: ChannelUpdateMetadata
  ): Promise<string> => {
    let jwtToken = await getJwt();

    let response = await axios.put(
      `https://edu.tardigrade.land/msg/protected/channel/${channelId}/update_metadata`,
      newChannelData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );

    if (response.status == 401) {
      throw new Error(
        "Can't update channel, you don't have permissions to perform this action"
      );
    } else if (response.status !== 200) {
      throw new Error("Can't update channel");
    }

    if (response.status === 200) {
      console.log("Channel updated");
    }

    return "updated";
  },

  getChannels: async (): Promise<ChannelMetadata[]> => {
    let jwtToken = await getJwt();

    let response = await axios.get(
      `https://edu.tardigrade.land/msg/protected/user/channels`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );

    if (response.status == 401) {
      throw new Error("Can't get channels, invalid token");
    } else if (response.status !== 200) {
      throw new Error("Can't get channels");
    }

    if (response.status === 200) {
      console.log("Channels retrieved");
    }

    let data: ChannelMetadata[] = response.data;

    return data;
  },

  ///////////////////////////////////////

  ///////////////////////////////////////////
  //////////// MESSAGES REQUESTS ////////////
  ///////////////////////////////////////////

  getMessages: async (
    channelId: number,
    batchOffset: number
  ): Promise<MessageMetadata[]> => {
    let jwtToken = await getJwt();

    let response = await axios.get(
      `https://edu.tardigrade.land/msg/protected/channel/${channelId}/messages/${batchOffset}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );

    if (response.status == 401) {
      throw new Error(
        "Can't get messages, user does not have permission to use this channel"
      );
    } else if (response.status !== 200) {
      throw new Error("Can't get messages");
    }

    if (response.status === 200) {
      console.log("Messages retrieved");
    }

    let data: MessageMetadata[] = response.data;

    return data;
  },

  sendMessage: async (
    channelId: number,
    newMessage: NewMessageData
  ): Promise<string> => {
    let jwtToken = await getJwt();

    let response = await axios.post(
      `https://edu.tardigrade.land/msg/protected/channel/${channelId}/message`,
      newMessage,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );

    if (response.status == 401) {
      throw new Error(
        "Can't sent message, user does not have permission to use this channel"
      );
    } else if (response.status !== 200) {
      throw new Error("Can't send message");
    }

    if (response.status === 200) {
      console.log("Message sent");
    }

    return "sent";
  },

  updateMessage: async (
    channelId: number,
    messageUpdate: MessageMetadata
  ): Promise<string> => {
    let jwtToken = await getJwt();

    let response = await axios.post(
      `https://edu.tardigrade.land/msg/protected/channel/${channelId}/message/moderate`,
      messageUpdate,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );

    if (response.status == 401) {
      throw new Error(
        "Can't moderate message, user does not have permission to use this channel"
      );
    } else if (response.status !== 200) {
      throw new Error("Can't moderate message");
    }

    if (response.status === 200) {
      console.log("Message updated");
    }

    return "updated";
  },
};
