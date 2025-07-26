import { useRouter } from "expo-router";
import { useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { getStoredToken, getStoredUser } from "../utils/storage";
import axios from "axios";
import Constants from "expo-constants";

// Example API call to validate token using axios
async function validateToken(token: string): Promise<boolean> {
  try {
    await axios.post(
      `${Constants.expoConfig?.extra?.apiUrl}api/v1//auth/validToken`,
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
      const checkAuthStatus = async () => {
        try {
          const storedToken = await getStoredToken();
          const storedUser = await getStoredUser();
          if (storedToken && storedUser) {
            const isValid = await validateToken(storedToken);
            if (isValid) {
              router.replace("/(tabs)/dashboard");
              return;
            }
          }
          router.replace("/auth");
        } catch (error) {
          console.error("Error checking auth status:", error);
          router.replace("/auth");
        }
      };

      checkAuthStatus();
    }, [])
  );

  return null;
}
