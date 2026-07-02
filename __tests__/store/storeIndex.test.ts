import { store, persistor } from "../../store/index";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(null),
  deleteItemAsync: jest.fn().mockResolvedValue(null),
}));

describe("store configuration", () => {
  it("should initialize store with servers state", () => {
    expect(store).toBeDefined();
    expect(store.getState).toBeDefined();
    
    const state = store.getState();
    expect(state).toHaveProperty("servers");
    expect(state.servers).toHaveProperty("accounts");
  });

  it("should initialize persistor", () => {
    expect(persistor).toBeDefined();
    expect(persistor.persist).toBeDefined();
  });
});
