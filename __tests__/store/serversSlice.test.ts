import serversReducer, {
  upsertServer,
  updateTokens,
  markSessionExpired,
  setServerStatus,
  setServerChannels,
  updateServerNickname,
  removeServer,
  setServerPushToken,
  ServerAccount,
} from "../../store/serversSlice";

describe("servers slice", () => {
  const initialState = { accounts: {} as Record<string, ServerAccount> };

  it("should return the initial state", () => {
    expect(serversReducer(undefined, { type: "unknown" })).toEqual(initialState);
  });

  it("should handle upsertServer", () => {
    const account: ServerAccount = {
      serverId: "http://localhost:3000",
      serverNickname: "Test Server",
      username: "user1",
      accessToken: "access_1",
      refreshToken: "refresh_1",
      status: "CONNECTED",
      channels: [],
    };

    const nextState = serversReducer(initialState, upsertServer(account));
    expect(nextState.accounts["http://localhost:3000"]).toEqual(account);
  });

  it("should handle updateTokens", () => {
    const existingState = {
      accounts: {
        "http://localhost:3000": {
          serverId: "http://localhost:3000",
          serverNickname: "Test Server",
          username: "user1",
          accessToken: "access_1",
          refreshToken: "refresh_1",
          status: "OFFLINE",
          channels: [],
        } as ServerAccount,
      },
    };

    const nextState = serversReducer(
      existingState,
      updateTokens({
        serverId: "http://localhost:3000",
        accessToken: "new_access",
        refreshToken: "new_refresh",
      })
    );

    const updatedAccount = nextState.accounts["http://localhost:3000"];
    expect(updatedAccount.accessToken).toBe("new_access");
    expect(updatedAccount.refreshToken).toBe("new_refresh");
    expect(updatedAccount.status).toBe("CONNECTED");
  });

  it("should handle markSessionExpired", () => {
    const existingState = {
      accounts: {
        "http://localhost:3000": {
          serverId: "http://localhost:3000",
          serverNickname: "Test Server",
          username: "user1",
          accessToken: "access_1",
          refreshToken: "refresh_1",
          status: "CONNECTED",
          channels: [],
        } as ServerAccount,
      },
    };

    const nextState = serversReducer(existingState, markSessionExpired("http://localhost:3000"));
    expect(nextState.accounts["http://localhost:3000"].status).toBe("SESSION_EXPIRED");
  });

  it("should handle setServerStatus", () => {
    const existingState = {
      accounts: {
        "http://localhost:3000": {
          serverId: "http://localhost:3000",
          serverNickname: "Test Server",
          username: "user1",
          accessToken: "access_1",
          refreshToken: "refresh_1",
          status: "CONNECTED",
          channels: [],
        } as ServerAccount,
      },
    };

    const nextState = serversReducer(
      existingState,
      setServerStatus({ serverId: "http://localhost:3000", status: "LOADING" })
    );
    expect(nextState.accounts["http://localhost:3000"].status).toBe("LOADING");
  });

  it("should handle setServerChannels", () => {
    const existingState = {
      accounts: {
        "http://localhost:3000": {
          serverId: "http://localhost:3000",
          serverNickname: "Test Server",
          username: "user1",
          accessToken: "access_1",
          refreshToken: "refresh_1",
          status: "LOADING",
          channels: [],
        } as ServerAccount,
      },
    };

    const newChannels = [{ id: 1, name: "general" }];
    const nextState = serversReducer(
      existingState,
      setServerChannels({ serverId: "http://localhost:3000", channels: newChannels })
    );

    const account = nextState.accounts["http://localhost:3000"];
    expect(account.channels).toEqual(newChannels);
    expect(account.status).toBe("CONNECTED");
  });

  it("should handle updateServerNickname", () => {
    const existingState = {
      accounts: {
        "http://localhost:3000": {
          serverId: "http://localhost:3000",
          serverNickname: "Old Name",
          username: "user1",
          accessToken: "access_1",
          refreshToken: "refresh_1",
          status: "CONNECTED",
          channels: [],
        } as ServerAccount,
      },
    };

    const nextState = serversReducer(
      existingState,
      updateServerNickname({ serverId: "http://localhost:3000", newNickname: "New Name" })
    );
    expect(nextState.accounts["http://localhost:3000"].serverNickname).toBe("New Name");
  });

  it("should handle removeServer", () => {
    const existingState = {
      accounts: {
        "http://localhost:3000": {
          serverId: "http://localhost:3000",
          serverNickname: "Test Server",
          username: "user1",
          accessToken: "access_1",
          refreshToken: "refresh_1",
          status: "CONNECTED",
          channels: [],
        } as ServerAccount,
      },
    };

    const nextState = serversReducer(existingState, removeServer("http://localhost:3000"));
    expect(nextState.accounts["http://localhost:3000"]).toBeUndefined();
  });

  it("should handle setServerPushToken", () => {
    const existingState = {
      accounts: {
        "http://localhost:3000": {
          serverId: "http://localhost:3000",
          serverNickname: "Test Server",
          username: "user1",
          accessToken: "access_1",
          refreshToken: "refresh_1",
          status: "CONNECTED",
          channels: [],
        } as ServerAccount,
      },
    };

    const nextState = serversReducer(
      existingState,
      setServerPushToken({ serverId: "http://localhost:3000", token: "push_token_xyz" })
    );
    expect(nextState.accounts["http://localhost:3000"].pushToken).toBe("push_token_xyz");
  });

  describe("when server does not exist", () => {
    it("should not crash and make no changes for updateTokens", () => {
      const nextState = serversReducer(
        initialState,
        updateTokens({ serverId: "non-existent", accessToken: "a", refreshToken: "r" })
      );
      expect(nextState.accounts["non-existent"]).toBeUndefined();
    });

    it("should not crash and make no changes for markSessionExpired", () => {
      const nextState = serversReducer(initialState, markSessionExpired("non-existent"));
      expect(nextState.accounts["non-existent"]).toBeUndefined();
    });

    it("should not crash and make no changes for setServerStatus", () => {
      const nextState = serversReducer(
        initialState,
        setServerStatus({ serverId: "non-existent", status: "CONNECTED" })
      );
      expect(nextState.accounts["non-existent"]).toBeUndefined();
    });

    it("should not crash and make no changes for setServerChannels", () => {
      const nextState = serversReducer(
        initialState,
        setServerChannels({ serverId: "non-existent", channels: [] })
      );
      expect(nextState.accounts["non-existent"]).toBeUndefined();
    });

    it("should not crash and make no changes for updateServerNickname", () => {
      const nextState = serversReducer(
        initialState,
        updateServerNickname({ serverId: "non-existent", newNickname: "Name" })
      );
      expect(nextState.accounts["non-existent"]).toBeUndefined();
    });

    it("should not crash and make no changes for setServerPushToken", () => {
      const nextState = serversReducer(
        initialState,
        setServerPushToken({ serverId: "non-existent", token: "tok" })
      );
      expect(nextState.accounts["non-existent"]).toBeUndefined();
    });
  });
});

