import { signInWithCustomToken } from "firebase/auth";
import { auth } from "../auth/firebase";
import axios from "axios";
import { storeToken, getStoredUser } from "./storage";
import Constants from "expo-constants";

export const coldSignIn = async (): Promise<string> => {
  try {
    const customToken = await getCustomToken();
    if (!customToken) {
      throw new Error("Custom token is required for sign-in");
    }
    const userCredential = await signInWithCustomToken(auth, customToken);
    const idToken = await userCredential.user.getIdToken();

    await storeToken(idToken);
    return idToken;
  } catch (error) {
    console.error("Error in coldSignIn:", error);
    throw error;
  }
};

const getCustomToken = async () => {
  try {
    const apiUrl = Constants.expoConfig?.extra?.User_URL;
    if (!apiUrl) {
      throw new Error("API URL is not defined in expo config");
    }
    const uid = await getStoredUser().then((user) => user?.uid);
    const response = await axios.post(`${apiUrl}/api/v1/auth/getCustomToken`, {
      uid,
    });
    if (response.status !== 200) {
      throw new Error("Failed to fetch custom token");
    }
    return response.data.customToken;
  } catch (error) {
    console.error("Error in getCustomToken:", error);
    throw error;
  }
};
