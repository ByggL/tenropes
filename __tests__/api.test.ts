import axios from "axios";
import { API } from "../utils/api";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("API Static Methods", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

      mockedAxios.isAxiosError.mockReturnValueOnce(true);
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
          data: { message: "Ce pseudo est déjà pris" },
        },
      };

      mockedAxios.isAxiosError.mockReturnValueOnce(true);
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

      mockedAxios.isAxiosError.mockReturnValueOnce(true);
      mockedAxios.post.mockRejectedValueOnce(mockError);

      await expect(API.registerServer(serverUrl, username, password)).rejects.toThrow(
        "Le mot de passe doit faire au moins 6 caractères"
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

      mockedAxios.isAxiosError.mockReturnValueOnce(true);
      mockedAxios.post.mockRejectedValueOnce(mockError);

      await expect(API.loginServer(serverUrl, username, password)).rejects.toThrow(
        "Login failed, invalid credentials"
      );
    });
  });
});
