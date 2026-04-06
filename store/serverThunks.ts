// store/serverThunks.ts
import { API } from "@/utils/api";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { RootState } from "./index";
import { removeServer, setServerPushToken } from "./serversSlice";

export const registerPushToken = createAsyncThunk(
  "servers/registerPushToken",
  async ({ serverId, expoToken }: { serverId: string; expoToken: string }, { dispatch }) => {
    console.log(`[DEBUG THUNK] Envoi du token à l'API ${serverId}...`);
    try {
      const api = new API(serverId);
      await api.postPushToken(expoToken);
      console.log("[DEBUG THUNK] Requête réussie ! Sauvegarde dans Redux.");
      dispatch(setServerPushToken({ serverId, token: expoToken }));
    } catch (error) {
      console.error("[DEBUG THUNK] Échec de la requête API :", error);
    }
  },
);

export const removeServerAndToken = createAsyncThunk(
  "servers/removeServerAndToken",
  async (serverId: string, { dispatch, getState }) => {
    const state = getState() as RootState;
    const targetServer = state.servers.accounts[serverId];
    const pushToken = targetServer?.pushToken;

    // Tentative de suppression réseau
    if (pushToken && targetServer?.status !== "SESSION_EXPIRED") {
      try {
        const api = new API(serverId);
        await api.removePushToken(pushToken);
      } catch (e) {
        console.log(`Serveur ${serverId} injoignable, suppression locale forcée.`);
      }
    }

    // Nettoyage de l'état local dans tous les cas
    dispatch(removeServer(serverId));
  },
);
