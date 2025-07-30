// utils/refreshIfInvalid.ts
import axios from "axios";
import { auth } from "../auth/firebase";
import { getStoredToken, storeToken } from "./storage";
import Constants from "expo-constants";
import { router } from "expo-router";

/**
 * Validates a token by calling the /validToken endpoint.
 */
const validateToken = async (token: string): Promise<boolean> => {
  try {
    await axios.post(
      `${Constants.expoConfig?.extra?.User_URL}/api/v1/auth/validToken`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return true;
  } catch (err) {
    console.warn("Token validation failed:", err);
    return false;
  }
};

/**
 * Ensures you have a valid token before making an API call.
 * If stored token is invalid, it refreshes from Firebase.
 */
export const refreshInvalidToken = async () => {
  let token = await getStoredToken();

  // Validate existing token
  if (token && (await validateToken(token))) {
    return;
  }

  // Try to refresh token if user is signed in
  const user = auth.currentUser;
  if (user) {
    try {
      const newToken = await user.getIdToken(true); // force refresh
      await storeToken(newToken);
      return;
    } catch (err) {
      console.error("Token refresh failed:", err);
    }
  }

  // If token cannot be refreshed or no user is signed in
  router.replace("/auth");
  throw new Error("Unable to refresh token. Redirecting to login.");
};
