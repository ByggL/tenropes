import { configureStore } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
import { secureStorage } from "./secureStorage";
import serversReducer from "./serversSlice";

const persistedReducer = persistReducer({ key: "tenropes", storage: secureStorage }, serversReducer);

export const store = configureStore({
  reducer: { servers: persistedReducer },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({ serializableCheck: false }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
