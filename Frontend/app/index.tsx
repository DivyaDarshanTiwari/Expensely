import { useRouter } from "expo-router";
import { useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { getStoredToken, getStoredUser, storeToken } from "../utils/storage";
import axios from "axios";
import Constants from "expo-constants";
import { coldSignIn } from "../utils/rehydaration";

// Validate the stored token with backend
async function validateToken(token: string): Promise<boolean> {
  try {
    await axios.post(
      `${Constants.expoConfig?.extra?.User_URL}/api/v1/auth/validToken`, // fixed double slash
      {},
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return true;
  } catch {
    return false;
  }
}

export default function Index() {
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const checkAuthStatus = async () => {
        try {
          let storedToken = await getStoredToken();
          const storedUser = await getStoredUser();

          if (storedToken && storedUser) {
            const isValid = await validateToken(storedToken);
            if (isValid && isActive) {
              router.replace("/(tabs)/dashboard");
              return;
            }
            // Try cold sign-in
            try {
              const newToken = await coldSignIn();
              if (newToken) {
                await storeToken(newToken);
                const isValidAfterSignIn = await validateToken(newToken);
                if (isValidAfterSignIn && isActive) {
                  router.replace("/(tabs)/dashboard");
                  return;
                }
              }
            } catch (err) {
              console.error("Cold sign-in failed:", err);
            }
          }

          // If nothing worked, go to auth
          if (isActive) router.replace("/auth");
        } catch (error) {
          console.error("Error checking auth status:", error);
          if (isActive) router.replace("/auth");
        }
      };

      checkAuthStatus();

      return () => {
        isActive = false;
      };
    }, [])
  );

  return null;
}
