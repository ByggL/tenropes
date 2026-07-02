import React from "react";
import { act, create } from "react-test-renderer";
import { Image, Text } from "react-native";

// Mock utils helpers used by MessageItem
const mockFormatTime = jest.fn(() => "12:00");
const mockGetUserFromName = jest.fn();
const mockIsSameDay = jest.fn();
const mockOptimizeTheme = jest.fn((t: any) => t);
jest.mock("@/utils/utils", () => ({
  formatTime: (...a: any[]) => mockFormatTime(...a),
  getUserFromName: (...a: any[]) => mockGetUserFromName(...a),
  isSameDay: (...a: any[]) => mockIsSameDay(...a),
  optimizeThemeForReadability: (...a: any[]) => mockOptimizeTheme(...a),
}));

// Capture ImageAttachment props so we know it rendered for non-text messages
let lastImageAttachmentProps: any = null;
jest.mock("@/components/chat/ImageAttachment", () => (props: any) => {
  lastImageAttachmentProps = props;
  return null;
});

import MessageItem from "@/components/chat/MessageItem";

const themeObj = {
  primary_color: "#111",
  primary_color_dark: "#000",
  accent_color: "#0ff",
  text_color: "#222",
  accent_text_color: "#fff",
};

function render(props: any) {
  let r: any;
  act(() => {
    r = create(<MessageItem {...props} />);
  });
  return r;
}

const msg = (over: any = {}) => ({
  id: 1,
  type: "Text",
  content: "hello",
  createdAt: "2024-01-01T12:00:00Z",
  author: { username: "alice", display_name: "Alice" },
  ...over,
});

describe("components/chat/MessageItem.tsx", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOptimizeTheme.mockImplementation((t: any) => t);
  });

  it("shows date separator + avatar + header for a first message with no older message", () => {
    mockGetUserFromName.mockReturnValue({ display_name: "Alice", username: "alice", img: "http://a/img.png" });
    const item = msg();
    const r = render({ item, index: 0, channel: { theme: themeObj }, messages: [item], members: [] });
    // avatar Image rendered (senderAvatar uses author.img)
    const images = r.root.findAllByType(Image);
    expect(images[0].props.source.uri).toBe("http://a/img.png");
    // date separator text present
    expect(r.root.findAllByType(Text).length).toBeGreaterThan(0);
    expect(mockFormatTime).toHaveBeenCalled();
  });

  it("renders compact (no header, placeholder avatar) for consecutive same-author same-day message", () => {
    mockGetUserFromName.mockReturnValue({ username: "alice", img: "http://a/img.png" });
    mockIsSameDay.mockReturnValue(true); // same day -> no separator
    const older = msg({ id: 2, author: { username: "alice", display_name: "Alice" } });
    const item = msg({ id: 1, author: { username: "alice", display_name: "Alice" } });
    // messages[index+1] is the older one
    const r = render({ item, index: 0, channel: { theme: themeObj }, messages: [item, older], members: [] });
    // isSameAuthor true & no separator -> avatar is a placeholder View, no Image
    expect(r.root.findAllByType(Image).length).toBe(0);
  });

  it("renders separator when older message is a different day, and different author shows header", () => {
    mockGetUserFromName.mockReturnValue({ username: "bob", img: "" }); // no img -> default avatar url
    mockIsSameDay.mockReturnValue(false); // different day -> separator shows
    const older = msg({ id: 2, author: { username: "carol", display_name: "Carol" } });
    const item = msg({ id: 1, type: "Image", content: "http://img/pic.png", author: { username: "bob", display_name: "Bob" } });
    const r = render({ item, index: 0, channel: { theme: themeObj }, messages: [item, older], members: [] });
    // Image type -> ImageAttachment rendered with the uri
    expect(lastImageAttachmentProps.uri).toBe("http://img/pic.png");
    // author img empty -> falls back to default avatar url
    expect(r.root.findAllByType(Image)[0].props.source.uri).toContain("pixelcorner");
  });

  it("falls back through the author name chain and the default theme when channel has no theme", () => {
    // author not found -> use item.author fields; and item.author.display_name empty -> username
    mockGetUserFromName.mockReturnValue(undefined);
    const item = msg({ author: { username: "iu", display_name: "" } });
    const r = render({ item, index: 0, channel: {}, messages: [item], members: [] });
    // default theme branch taken (optimizeThemeForReadability NOT called)
    expect(mockOptimizeTheme).not.toHaveBeenCalled();
    const authorName = r.root.findAllByType(Text).find((t: any) => t.props.children === "iu");
    expect(authorName).toBeTruthy();
  });

  it("uses item.author.display_name when the resolved author is missing but display_name exists", () => {
    mockGetUserFromName.mockReturnValue(undefined);
    const item = msg({ author: { username: "iu", display_name: "Item Display" } });
    const r = render({ item, index: 0, channel: { theme: themeObj }, messages: [item], members: [] });
    const authorName = r.root.findAllByType(Text).find((t: any) => t.props.children === "Item Display");
    expect(authorName).toBeTruthy();
  });

  it("uses the resolved author username when display_name is absent", () => {
    mockGetUserFromName.mockReturnValue({ username: "resolvedUser" });
    const item = msg({ author: { username: "iu", display_name: "Item Display" } });
    const r = render({ item, index: 0, channel: { theme: themeObj }, messages: [item], members: [] });
    const authorName = r.root.findAllByType(Text).find((t: any) => t.props.children === "resolvedUser");
    expect(authorName).toBeTruthy();
  });
});
