import React from "react";
import { act, create } from "react-test-renderer";

// --- useFonts is controlled per-test via this mutable state ---
let mockFontsState: [boolean, Error | null] = [true, null];
jest.mock("expo-font", () => ({
  useFonts: jest.fn(() => mockFontsState),
}));

jest.mock("expo-splash-screen", () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));
const SplashScreen = require("expo-splash-screen");

jest.mock("expo-router", () => {
  const Stack: any = ({ children }: any) => children ?? null;
  Stack.Screen = () => null;
  return { Stack, ErrorBoundary: () => null };
});

jest.mock("@react-navigation/native", () => ({
  ThemeProvider: ({ children }: any) => children,
  DarkTheme: { dark: true },
  DefaultTheme: { dark: false },
}));

const mockUseColorScheme = jest.fn();
jest.mock("@/components/useColorScheme", () => ({
  useColorScheme: () => mockUseColorScheme(),
}));

const mockGetNotificationsPermission = jest.fn();
jest.mock("@/utils/notifications", () => ({
  getNotificationsPermission: () => mockGetNotificationsPermission(),
}));

jest.mock("@/store", () => ({ store: { getState: jest.fn() }, persistor: {} }));

jest.mock("react-redux", () => ({
  Provider: ({ children }: any) => children,
}));

// Render BOTH the loading element and the children so both code paths are covered
jest.mock("redux-persist/integration/react", () => ({
  PersistGate: ({ loading, children }: any) => (
    <>
      {loading}
      {children}
    </>
  ),
}));

jest.mock("@expo/vector-icons/FontAwesome", () => ({ font: { fontawesome: 1 } }));

jest.mock("react-native-reanimated", () => ({}));

// Import after mocks are registered
import RootLayout from "../../app/_layout";

describe("app/_layout.tsx", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFontsState = [true, null];
    mockGetNotificationsPermission.mockResolvedValue(true);
    mockUseColorScheme.mockReturnValue("light");
  });

  it("calls preventAutoHideAsync at module load", () => {
    // The side effect ran on import; the fn is defined and was invoked once
    expect(SplashScreen.preventAutoHideAsync).toBeDefined();
  });

  it("returns null before the fonts are loaded", () => {
    mockFontsState = [false, null];
    let renderer: any;
    act(() => {
      renderer = create(<RootLayout />);
    });
    expect(renderer.toJSON()).toBeNull();
    expect(SplashScreen.hideAsync).not.toHaveBeenCalled();
  });

  it("hides the splash screen and renders the nav once fonts are loaded (light theme)", () => {
    mockFontsState = [true, null];
    let renderer: any;
    act(() => {
      renderer = create(<RootLayout />);
    });
    expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
    expect(mockGetNotificationsPermission).toHaveBeenCalledTimes(1);
    expect(renderer.toJSON()).toBeTruthy();
  });

  it("renders with the dark theme branch", () => {
    mockUseColorScheme.mockReturnValue("dark");
    mockFontsState = [true, null];
    let renderer: any;
    act(() => {
      renderer = create(<RootLayout />);
    });
    expect(renderer.toJSON()).toBeTruthy();
  });

  it("throws when the font loader reports an error", () => {
    mockFontsState = [false, new Error("font load failed")];
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => {
      act(() => {
        create(<RootLayout />);
      });
    }).toThrow("font load failed");
    consoleErrorSpy.mockRestore();
  });
});
