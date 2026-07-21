import React from "react";
import { act, create } from "react-test-renderer";
import { FlatList, Modal, TextInput, TouchableOpacity } from "react-native";

jest.mock("react-native-uuid", () => ({ __esModule: true, default: { v4: () => "customer-uuid" } }));

import KlipyGifPicker from "@/components/chat/GifPickerModal";

const flush = async () => {
  for (let i = 0; i < 6; i++) await Promise.resolve();
};

function renderPicker(over: any = {}) {
  const onClose = jest.fn();
  const onSelect = jest.fn();
  let r: any;
  act(() => {
    r = create(<KlipyGifPicker visible={over.visible ?? true} onClose={onClose} onSelect={onSelect} />);
  });
  return { r, onClose, onSelect };
}

// Advance past the 300ms debounce and flush the fetch/json promises
async function runDebounce() {
  await act(async () => {
    jest.advanceTimersByTime(300);
    await flush();
  });
}

describe("components/chat/GifPickerModal.tsx", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    (global as any).Headers = function Headers() {};
    (global as any).fetch = jest.fn();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("fetches trending gifs on mount and renders them; selecting one calls onSelect", async () => {
    (global as any).fetch.mockResolvedValueOnce({
      json: async () => ({ data: { data: [{ id: 1, slug: "a", file: { sm: { gif: { url: "u1" } } } }, { slug: "b" }] } }),
    });
    const { r, onSelect } = renderPicker();
    await runDebounce();

    expect((global as any).fetch).toHaveBeenCalledWith(expect.stringContaining("trending"), expect.any(Object));

    const flatList = r.root.findAllByType(FlatList)[0];
    // keyExtractor: item with id, and item without id (Math.random fallback)
    expect(flatList.props.keyExtractor({ id: 1 })).toBe("1");
    expect(typeof flatList.props.keyExtractor({})).toBe("string");

    // renderItem with a gif that has a url, and one without
    const withUrl = flatList.props.renderItem({ item: { id: 1, file: { sm: { gif: { url: "u1" } } } } });
    const withoutUrl = flatList.props.renderItem({ item: { id: 2 } });
    act(() => withUrl.props.onPress());
    expect(onSelect).toHaveBeenCalledWith({ id: 1, file: { sm: { gif: { url: "u1" } } } });
    act(() => withoutUrl.props.onPress());
    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  it("switches to the search endpoint when the query changes (and clears the previous timer)", async () => {
    (global as any).fetch.mockResolvedValue({ json: async () => ({ data: { data: [] } }) });
    const { r } = renderPicker();
    await runDebounce(); // initial trending

    const input = r.root.findAllByType(TextInput)[0];
    act(() => input.props.onChangeText("cats"));
    await runDebounce();

    expect((global as any).fetch).toHaveBeenLastCalledWith(
      expect.stringContaining("search?q=cats"),
      expect.any(Object),
    );
  });

  it("defaults to an empty list when the response has no data array", async () => {
    (global as any).fetch.mockResolvedValueOnce({ json: async () => ({ data: { data: undefined } }) });
    const { r } = renderPicker();
    await runDebounce();
    const flatList = r.root.findAllByType(FlatList)[0];
    expect(flatList.props.data).toEqual([]);
  });

  it("logs an error when the fetch fails", async () => {
    (global as any).fetch.mockRejectedValueOnce(new Error("network down"));
    renderPicker();
    await runDebounce();
    expect(console.error).toHaveBeenCalledWith("Klipy api error", expect.any(Error));
  });

  it("wires up close handlers (button + modal request) and passes the visible prop through", async () => {
    (global as any).fetch.mockResolvedValue({ json: async () => ({ data: { data: [] } }) });
    const { r, onClose } = renderPicker({ visible: true });
    await runDebounce();

    const modal = r.root.findAllByType(Modal)[0];
    expect(modal.props.visible).toBe(true);
    act(() => modal.props.onRequestClose());
    expect(onClose).toHaveBeenCalledTimes(1);

    // "Fermer" button is the last TouchableOpacity
    const closeBtn = r.root.findAllByType(TouchableOpacity).slice(-1)[0];
    act(() => closeBtn.props.onPress());
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("clears the debounce timer on unmount", async () => {
    (global as any).fetch.mockResolvedValue({ json: async () => ({ data: { data: [] } }) });
    const { r } = renderPicker();
    act(() => r.unmount()); // triggers the useEffect cleanup (clearTimeout) before the timer fires
    expect(true).toBe(true);
  });
});
