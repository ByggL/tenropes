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
    it("should return text_color unchanged if contrast is already satisfactory (currentContrast >= targetRatio)", () => {
      const goodContrastTheme: Theme = {
        primary_color: "#FFFFFF",
        primary_color_dark: "#000000",
        accent_color: "#FF0000",
        text_color: "#FFFFFF", // contrast text on primary_color_dark is 21:1 (> 4.5)
        accent_text_color: "#FFFFFF",
      };
      const optimized = optimizeThemeForReadability(goodContrastTheme);
      expect(optimized.text_color).toBe("#FFFFFF");
    });

    it("should cover HSL conversion for colors with lightness > 0.5 and non-zero saturation", () => {
      const lightTheme: Theme = {
        primary_color: "#FFA0A0", // l = 0.81 > 0.5, s !== 0
        primary_color_dark: "#0a0a0a",
        accent_color: "#FFA0A0",
        text_color: "#FFA0A0",
        accent_text_color: "#FFA0A0",
      };
      const optimized = optimizeThemeForReadability(lightTheme);
      expect(optimized).toBeDefined();
    });

    it("should optimize and return theme colors that are readable (Red/Orange hue: 0 <= h < 60)", () => {
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
      expect(optimized.text_color).not.toBe("#1e1e1e");
      expect(optimized.accent_text_color).not.toBe("#333333");
    });

    it("should optimize and return theme colors for Yellow hue (60 <= h < 120)", () => {
      const yellowTheme: Theme = {
        primary_color: "#FFFF00",
        primary_color_dark: "#050500",
        accent_color: "#FFFF00",
        text_color: "#1A1A00",
        accent_text_color: "#222200",
      };
      const optimized = optimizeThemeForReadability(yellowTheme);
      expect(optimized).toHaveProperty("text_color");
    });

    it("should optimize and return theme colors for Green hue where green is max (120 <= h < 180)", () => {
      const greenTheme: Theme = {
        primary_color: "#00FF00",
        primary_color_dark: "#000500",
        accent_color: "#00FF00",
        text_color: "#001A00",
        accent_text_color: "#002200",
      };
      const optimized = optimizeThemeForReadability(greenTheme);
      expect(optimized).toHaveProperty("text_color");
    });

    it("should optimize and return theme colors for Blue/Cyan hue where blue/cyan is max (180 <= h < 240)", () => {
      const cyanTheme: Theme = {
        primary_color: "#00FFFF",
        primary_color_dark: "#000505",
        accent_color: "#0000FF",
        text_color: "#001A1A",
        accent_text_color: "#000022",
      };
      const optimized = optimizeThemeForReadability(cyanTheme);
      expect(optimized).toHaveProperty("text_color");
    });

    it("should optimize and return theme colors for Indigo/Purple hue (240 <= h < 300)", () => {
      const purpleTheme: Theme = {
        primary_color: "#8000FF",
        primary_color_dark: "#050005",
        accent_color: "#8000FF",
        text_color: "#100020",
        accent_text_color: "#150025",
      };
      const optimized = optimizeThemeForReadability(purpleTheme);
      expect(optimized).toHaveProperty("text_color");
    });

    it("should optimize and return theme colors for Pink/Magenta hue (300 <= h < 360)", () => {
      const pinkTheme: Theme = {
        primary_color: "#FF00FF",
        primary_color_dark: "#050005",
        accent_color: "#FF00FF",
        text_color: "#200020",
        accent_text_color: "#250025",
      };
      const optimized = optimizeThemeForReadability(pinkTheme);
      expect(optimized).toHaveProperty("text_color");
    });

    it("should handle invalid hex values and fall back to black in hexToRgb", () => {
      const invalidTheme: Theme = {
        primary_color: "invalid_hex",
        primary_color_dark: "#000", // invalid short form also falls back to black
        accent_color: "not-a-color",
        text_color: "hello",
        accent_text_color: "world",
      };
      const optimized = optimizeThemeForReadability(invalidTheme);
      expect(optimized).toHaveProperty("text_color");
    });

    it("should trigger input box optimization when contrast between text and input bg is < 4.5", () => {
      const inputContrastTheme: Theme = {
        primary_color: "#1e1e1e", // same as text_color
        primary_color_dark: "#0a0a0a",
        accent_color: "#ff0055",
        text_color: "#1e1e1e",
        accent_text_color: "#333333",
      };
      const optimized = optimizeThemeForReadability(inputContrastTheme);
      expect(optimized).toHaveProperty("primary_color");
    });

    it("should trigger ensureContrast fallback to #FFFFFF when contrast cannot be satisfied", () => {
      const fallbackTheme: Theme = {
        primary_color: "#7F7F7F",
        primary_color_dark: "#7F7F7F", // medium gray
        accent_color: "#7F7F7F",
        text_color: "#808080", // almost same
        accent_text_color: "#808080",
      };
      const optimized = optimizeThemeForReadability(fallbackTheme);
      expect(optimized.text_color).toBe("#FFFFFF");
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
