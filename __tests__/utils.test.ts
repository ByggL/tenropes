import {
  isImgUrl,
  formatImgUrl,
  optimizeThemeForReadability,
  formatTime,
  getUserFromName,
  isSameDay,
} from "../utils/utils";
import { Theme, UserMetadata } from "@/types/types";

describe("Utils Helper Functions", () => {
  describe("isImgUrl", () => {
    it("should return true for valid image extensions", () => {
      expect(isImgUrl("http://example.com/pic.jpg")).toBe(true);
      expect(isImgUrl("https://example.com/image.png")).toBe(true);
      expect(isImgUrl("file.webp")).toBe(true);
      expect(isImgUrl("avatar.gif")).toBe(true);
      expect(isImgUrl("photo.jpeg")).toBe(true);
      expect(isImgUrl("photo.avif")).toBe(true);
    });

    it("should return false for invalid or missing image extensions", () => {
      expect(isImgUrl("http://example.com/pic.html")).toBe(false);
      expect(isImgUrl("http://example.com/pic.jpg/more")).toBe(false);
      expect(isImgUrl("file.pdf")).toBe(false);
      expect(isImgUrl("random-text")).toBe(false);
    });
  });

  describe("formatImgUrl", () => {
    it("should extract image url path until the extension", () => {
      expect(formatImgUrl("http://example.com/pic.jpg?token=123")).toBe("http://example.com/pic.jpg");
      expect(formatImgUrl("http://example.com/pic.PNG?w=100")).toBe("http://example.com/pic.PNG");
    });

    it("should return original url if no match is found", () => {
      expect(formatImgUrl("http://example.com/no-extension")).toBe("http://example.com/no-extension");
    });

    it("should throw an error if url is empty or undefined", () => {
      expect(() => formatImgUrl("")).toThrow("Url is undefined");
    });
  });

  describe("optimizeThemeForReadability", () => {
    it("should optimize and return theme colors that are readable", () => {
      const lowContrastTheme: Theme = {
        primary_color: "#121212",
        primary_color_dark: "#0a0a0a",
        accent_color: "#ff0055",
        text_color: "#1e1e1e", // very dark gray on dark background
        accent_text_color: "#333333", // also dark on dark
      };

      const optimized = optimizeThemeForReadability(lowContrastTheme);

      expect(optimized).toHaveProperty("primary_color");
      expect(optimized).toHaveProperty("primary_color_dark");
      expect(optimized.text_color).not.toBe("#1e1e1e"); // text color should have changed to be more readable
      expect(optimized.accent_text_color).not.toBe("#333333");
    });
  });

  describe("formatTime", () => {
    it("should format timestamps correctly", () => {
      const timestamp = new Date("2026-07-01T14:00:00").getTime();
      const formatted = formatTime(timestamp);
      expect(formatted).toMatch(/^\d{2}:\d{2}$/); // matches e.g. "14:00"
    });
  });

  describe("getUserFromName", () => {
    const mockMembers: UserMetadata[] = [
      { username: "alice", display_name: "Alice", img: "img1", status: "online" },
      { username: "bob", display_name: "Bob", img: "img2", status: "offline" },
    ];

    it("should return the correct user object if found", () => {
      expect(getUserFromName(mockMembers, "alice")).toEqual(mockMembers[0]);
    });

    it("should return undefined if user is not found", () => {
      expect(getUserFromName(mockMembers, "charlie")).toBeUndefined();
    });
  });

  describe("isSameDay", () => {
    it("should return true for timestamps on the same day", () => {
      const t1 = new Date("2026-07-01T10:00:00").getTime();
      const t2 = new Date("2026-07-01T18:00:00").getTime();
      expect(isSameDay(t1, t2)).toBe(true);
    });

    it("should return false for timestamps on different days", () => {
      const t1 = new Date("2026-07-01T23:59:59").getTime();
      const t2 = new Date("2026-07-02T00:00:01").getTime();
      expect(isSameDay(t1, t2)).toBe(false);
    });
  });
});
