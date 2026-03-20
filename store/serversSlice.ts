// store/serversSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type ServerStatus = "IDLE" | "LOADING" | "CONNECTED" | "OFFLINE" | "SESSION_EXPIRED";

export interface ServerAccount {
  serverId: string;
  serverNickname: string;
  username: string;
  accessToken: string;
  refreshToken: string;
  status: ServerStatus;
  channels: any[];
  pushToken?: string;
}

const serversSlice = createSlice({
  name: "servers",
  initialState: { accounts: {} as Record<string, ServerAccount> },
  reducers: {
    upsertServer: (state, action: PayloadAction<ServerAccount>) => {
      state.accounts[action.payload.serverId] = action.payload;
    },
    // RESTORED: This is the critical function I shouldn't have touched
    updateTokens: (state, action: PayloadAction<{ serverId: string; accessToken: string; refreshToken: string }>) => {
      const server = state.accounts[action.payload.serverId];
      if (server) {
        server.accessToken = action.payload.accessToken;
        server.refreshToken = action.payload.refreshToken;
        server.status = "CONNECTED";
      }
    },
    // RESTORED/UPDATED: Keeps the name but uses our new status type
    markSessionExpired: (state, action: PayloadAction<string>) => {
      const server = state.accounts[action.payload];
      if (server) server.status = "SESSION_EXPIRED";
    },
    // NEW: Specifically for the background fetcher
    setServerStatus: (state, action: PayloadAction<{ serverId: string; status: ServerStatus }>) => {
      if (state.accounts[action.payload.serverId]) {
        state.accounts[action.payload.serverId].status = action.payload.status;
      }
    },
    setServerChannels: (state, action: PayloadAction<{ serverId: string; channels: any[] }>) => {
      const server = state.accounts[action.payload.serverId];
      if (server) {
        server.channels = action.payload.channels;
        server.status = "CONNECTED";
      }
    },
    updateServerNickname: (state, action: PayloadAction<{ serverId: string; newNickname: string }>) => {
      const server = state.accounts[action.payload.serverId];
      if (server) server.serverNickname = action.payload.newNickname;
    },
    removeServer: (state, action: PayloadAction<string>) => {
      delete state.accounts[action.payload];
    },
    setServerPushToken: (state, action: PayloadAction<{ serverId: string; token: string }>) => {
      const server = state.accounts[action.payload.serverId];
      if (server) {
        server.pushToken = action.payload.token;
      }
    },
  },
});

export const {
  upsertServer,
  updateTokens,
  markSessionExpired,
  setServerStatus,
  setServerChannels,
  updateServerNickname,
  removeServer,
  setServerPushToken,
} = serversSlice.actions;

export default serversSlice.reducer;
