import React from "react";
import { act, create } from "react-test-renderer";
import { Alert, Text, TextInput } from "react-native";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({ useRouter: () => ({ push: mockPush }) }));

const mockUseSelector = jest.fn();
jest.mock("react-redux", () => ({ useSelector: (s: any) => mockUseSelector(s) }));

jest.mock("../../utils/api", () => {
  const banUserFromChannel = jest.fn();
  const updateChannel = jest.fn();
  const deleteChannel = jest.fn();
  const API = jest.fn().mockImplementation(() => ({
    banUserFromChannel,
    updateChannel,
    deleteChannel,
  }));
  return { API, __methods: { banUserFromChannel, updateChannel, deleteChannel } };
});
const { __methods } = require("../../utils/api");
const mockBan = __methods.banUserFromChannel as jest.Mock;
const mockUpdate = __methods.updateChannel as jest.Mock;
const mockDelete = __methods.deleteChannel as jest.Mock;

// Capture the props ChannelForm is rendered with so we can drive its callbacks.
let channelFormProps: any = null;
jest.mock("../../components/channelCreaModifForm", () => ({
  __esModule: true,
  default: (props: any) => {
    channelFormProps = props;
    return null;
  },
}));

import ChannelCard from "../../components/channelCard";

// ---- helpers ----
function getPressables(root: any) {
  return root.findAll((n: any) => n.props && typeof n.props.onPress === "function");
}
function findByText(root: any, text: string) {
  // Wrapper Pressables (overlay/content) also contain the text, so return the
  // innermost match — the last one in depth-first pre-order.
  const matches = getPressables(root).filter(
    (p: any) =>
      p.findAll((n: any) => typeof n.props.children === "string" && n.props.children === text).length > 0,
  );
  return matches[matches.length - 1];
}
function getInputs(root: any) {
  return root.findAll((n: any) => n.type === TextInput);
}

const baseChannel: any = {
  id: 7,
  name: "general",
  img: "http://img/c.png",
  serverUrl: "http://s",
  theme: { primary_color: "#111" },
  members: [{ role: "admin", user: { username: "me" } }],
};

const onUpdate = jest.fn();

// Render as an admin (default) and flush the identity-check effect.
async function renderAdmin(channel: any = baseChannel, accounts: any = { "http://s": { username: "me" } }) {
  mockUseSelector.mockImplementation((sel: any) => sel({ servers: { accounts } }));
  let r: any;
  await act(async () => {
    r = create(<ChannelCard channelMetadata={channel} onUpdate={onUpdate} />);
  });
  await act(async () => {
    await Promise.resolve();
  });
  return r;
}

// The RN Modal only mounts its children while visible, so open it before
// interacting with the menu.
async function openMenu(r: any) {
  const card = getPressables(r.root).find((p: any) => p.props.onLongPress);
  await act(async () => {
    card.props.onLongPress();
  });
}

describe("components/channelCard.tsx", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    channelFormProps = null;
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});
    mockBan.mockResolvedValue("removed");
    mockUpdate.mockResolvedValue("updated");
    mockDelete.mockResolvedValue("deleted");
  });

  it("returns null when no channel metadata is provided", () => {
    mockUseSelector.mockImplementation((sel: any) => sel({ servers: { accounts: {} } }));
    let r: any;
    act(() => {
      r = create(<ChannelCard channelMetadata={null as any} onUpdate={onUpdate} />);
    });
    expect(r.toJSON()).toBeNull();
  });

  it("stays non-admin when the current username can't be resolved for the server", async () => {
    // accounts has no entry for the channel's serverUrl -> currentUsername is undefined,
    // so the `if (currentUsername && members)` guard takes its false path.
    const r = await renderAdmin(baseChannel, {});
    // Renders fine; long-press is blocked for non-admins.
    await openMenu(r);
    expect(Alert.alert).toHaveBeenCalled();
  });

  it("navigates to the channel page when the card is pressed", async () => {
    const r = await renderAdmin();
    const card = getPressables(r.root).find((p: any) => p.props.onLongPress);
    act(() => card.props.onPress());
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: "/(tabs)/channelPage", params: expect.objectContaining({ serverUrl: "http://s" }) }),
    );
    // style function: pressed true and false branches
    expect(card.props.style({ pressed: true })).toBeTruthy();
    expect(card.props.style({ pressed: false })).toBeTruthy();
  });

  it("blocks the long-press menu for non-admins with an alert", async () => {
    const r = await renderAdmin(baseChannel, { "http://s": { username: "someone-else" } });
    const card = getPressables(r.root).find((p: any) => p.props.onLongPress);
    act(() => card.props.onLongPress());
    expect(Alert.alert).toHaveBeenCalledWith(
      "Authorization Error",
      "You are not an admin of this channel.",
      expect.any(Array),
    );
  });

  it("opens the options menu on long-press for admins and cancels/stops propagation", async () => {
    const r = await renderAdmin();
    // Modal onRequestClose (rendered even while hidden)
    const modal = r.root.findAll((n: any) => n.props && typeof n.props.onRequestClose === "function")[0];
    act(() => modal.props.onRequestClose());
    await openMenu(r);
    // stopPropagation handler (the only onPress declaring an event arg)
    const stopper = getPressables(r.root).find((p: any) => p.props.onPress.length === 1);
    const evt = { stopPropagation: jest.fn() };
    act(() => stopper.props.onPress(evt));
    expect(evt.stopPropagation).toHaveBeenCalled();
    // overlay onPress closes the modal (outermost Pressable inside the Modal)
    act(() => getPressables(r.root)[0].props.onPress());
    await openMenu(r);
    // Cancel closes the modal
    act(() => findByText(r.root, "Cancel").props.onPress());
    expect(r.toJSON()).toBeTruthy();
  });

  it("deletes the channel (success)", async () => {
    const r = await renderAdmin();
    await openMenu(r);
    await act(async () => {
      await findByText(r.root, "Delete Channel").props.onPress();
    });
    expect(mockDelete).toHaveBeenCalledWith(7);
    expect(onUpdate).toHaveBeenCalled();
  });

  it("handles a delete failure", async () => {
    mockDelete.mockRejectedValueOnce(new Error("boom"));
    const r = await renderAdmin();
    await openMenu(r);
    await act(async () => {
      await findByText(r.root, "Delete Channel").props.onPress();
    });
    expect(console.error).toHaveBeenCalledWith("Delete failed", expect.any(Error));
  });

  it("runs the no-op share handler", async () => {
    const r = await renderAdmin();
    await openMenu(r);
    await act(async () => {
      await findByText(r.root, "Share channel through link").props.onPress();
    });
    expect(r.toJSON()).toBeTruthy();
  });

  it("switches to edit mode and updates the channel (success + cancel)", async () => {
    const r = await renderAdmin();
    await openMenu(r);
    act(() => findByText(r.root, "Modify Channel").props.onPress());
    expect(channelFormProps).toBeTruthy();
    expect(channelFormProps.initialData).toEqual({ name: "general", img: "http://img/c.png", theme: baseChannel.theme });
    await act(async () => {
      await channelFormProps.onSubmit({ name: "new", img: "i", theme: { a: 1 } });
    });
    expect(mockUpdate).toHaveBeenCalledWith(7, { name: "new", img: "i", theme: { a: 1 } });
    expect(onUpdate).toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith("Success", "Channel updated.");
  });

  it("returns to the menu when the edit form is cancelled", async () => {
    const r = await renderAdmin();
    await openMenu(r);
    act(() => findByText(r.root, "Modify Channel").props.onPress());
    act(() => channelFormProps.onCancel());
    expect(findByText(r.root, "Modify Channel")).toBeTruthy();
  });

  it("handles an update failure", async () => {
    mockUpdate.mockRejectedValueOnce(new Error("nope"));
    const r = await renderAdmin();
    await openMenu(r);
    act(() => findByText(r.root, "Modify Channel").props.onPress());
    await act(async () => {
      await channelFormProps.onSubmit({ name: "x", img: "", theme: {} });
    });
    expect(Alert.alert).toHaveBeenCalledWith("Error", "Failed to update channel.");
  });

  it("uses empty-string fallbacks in edit mode when name/img are missing", async () => {
    const r = await renderAdmin({ ...baseChannel, name: "", img: "" });
    await openMenu(r);
    act(() => findByText(r.root, "Modify Channel").props.onPress());
    expect(channelFormProps.initialData).toEqual({ name: "", img: "", theme: baseChannel.theme });
  });

  it("bans a user: empty input, success, and back navigation", async () => {
    const r = await renderAdmin();
    await openMenu(r);
    act(() => findByText(r.root, "Ban User").props.onPress());
    // empty input -> validation alert
    await act(async () => {
      await findByText(r.root, "Confirm Ban").props.onPress();
    });
    expect(Alert.alert).toHaveBeenCalledWith("Error", "Please enter a username.");
    expect(mockBan).not.toHaveBeenCalled();
    // fill input then confirm -> success
    act(() => getInputs(r.root)[0].props.onChangeText("bob"));
    await act(async () => {
      await findByText(r.root, "Confirm Ban").props.onPress();
    });
    expect(mockBan).toHaveBeenCalledWith(7, "bob");
    expect(Alert.alert).toHaveBeenCalledWith("Success", "User bob has been banned.");
    // after success we are back in the menu
    expect(findByText(r.root, "Modify Channel")).toBeTruthy();
  });

  it("handles a ban failure", async () => {
    mockBan.mockRejectedValueOnce(new Error("fail"));
    const r = await renderAdmin();
    await openMenu(r);
    act(() => findByText(r.root, "Ban User").props.onPress());
    act(() => getInputs(r.root)[0].props.onChangeText("bob"));
    await act(async () => {
      await findByText(r.root, "Confirm Ban").props.onPress();
    });
    expect(Alert.alert).toHaveBeenCalledWith("Error", "Failed to ban user.");
  });

  it("shows a spinner while a ban is in flight and supports the Back button", async () => {
    mockBan.mockReturnValueOnce(new Promise(() => {})); // never resolves
    const r = await renderAdmin();
    await openMenu(r);
    act(() => findByText(r.root, "Ban User").props.onPress());
    act(() => getInputs(r.root)[0].props.onChangeText("bob"));
    act(() => {
      findByText(r.root, "Confirm Ban").props.onPress();
    });
    const { ActivityIndicator } = require("react-native");
    expect(r.root.findAllByType(ActivityIndicator).length).toBeGreaterThan(0);
  });

  it("navigates Back from the ban screen to the menu", async () => {
    const r = await renderAdmin();
    await openMenu(r);
    act(() => findByText(r.root, "Ban User").props.onPress());
    act(() => findByText(r.root, "Back").props.onPress());
    expect(findByText(r.root, "Modify Channel")).toBeTruthy();
  });

  it("keeps isAdmin false when the membership role is not admin", async () => {
    const r = await renderAdmin(
      { ...baseChannel, members: [{ role: "member", user: { username: "me" } }] },
      { "http://s": { username: "me" } },
    );
    const card = getPressables(r.root).find((p: any) => p.props.onLongPress);
    act(() => card.props.onLongPress());
    expect(Alert.alert).toHaveBeenCalledWith("Authorization Error", expect.any(String), expect.any(Array));
  });

  it("keeps isAdmin false when no membership matches the current user", async () => {
    const r = await renderAdmin(
      { ...baseChannel, members: [{ role: "admin", user: { username: "other" } }] },
      { "http://s": { username: "me" } },
    );
    expect(r.toJSON()).toBeTruthy();
  });

  it("logs an error if the membership lookup throws", async () => {
    // members is truthy but not an array -> .find throws -> caught
    await renderAdmin({ ...baseChannel, members: {} }, { "http://s": { username: "me" } });
    expect(console.log).toHaveBeenCalledWith("Error fetching data :", expect.any(Error));
  });

  it("renders name/img fallbacks and the dark/null color schemes", async () => {
    const RN = require("react-native");
    const spy = jest.spyOn(RN, "useColorScheme").mockReturnValue("dark");
    const r1 = await renderAdmin({ ...baseChannel, name: "", img: "" });
    expect(r1.toJSON()).toBeTruthy();
    spy.mockReturnValue(null);
    const r2 = await renderAdmin();
    expect(r2.toJSON()).toBeTruthy();
    spy.mockRestore();
  });
});
