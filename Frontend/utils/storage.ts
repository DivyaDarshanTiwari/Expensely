import * as SecureStore from "expo-secure-store";

export const storeToken = async (token: string) => {
  await SecureStore.setItemAsync("userToken", token);
};

export const getStoredToken = async () => {
  return await SecureStore.getItemAsync("userToken");
};

export const storeUserId = async (userId: string | number) => {
  await SecureStore.setItemAsync("userId", String(userId));
};

export const getStoredUserId = async () => {
  return await SecureStore.getItemAsync("userId");
}; 