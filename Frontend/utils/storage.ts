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

export const storeUser = async (user: any) => {
  await SecureStore.setItemAsync("user", JSON.stringify(user));
};

export const getStoredUser = async () => {
  const userString = await SecureStore.getItemAsync("user");
  return userString ? JSON.parse(userString) : null;
};

export const clearUserData = async () => {
  await SecureStore.deleteItemAsync("userToken");
  await SecureStore.deleteItemAsync("userId");
  await SecureStore.deleteItemAsync("user");
};
