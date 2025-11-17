import { ExtendSessionResponse, LoginResponse, UserMetadata } from "@/types/api_types";
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
    throw new Error("Failed to retrieve JWT token");
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

    let response = await axios.post("https://edu.tardigrade.land/msg/protected/extend_session", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
    });

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

    let response = await axios.post("https://edu.tardigrade.land/msg/protected/user/meta", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
    });

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

    let response = await axios.post("https://edu.tardigrade.land/msg/protected/user/meta", newUserData, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
    });

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
};
