import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect } from "react";
import { auth } from "../auth/firebase";
import { getStoredToken, getStoredUser } from "../utils/storage";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Check for stored token first
        const storedToken = await getStoredToken();
        const storedUser = await getStoredUser();

        if (storedToken && storedUser) {
          // If token exists, navigate to dashboard
          router.replace("/(tabs)/dashboard");
        } else {
          // If no token or user, check Firebase auth state as fallback
          const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
              router.replace("/(tabs)/dashboard");
            } else {
              router.replace("/auth");
            }
          });

          // Clean up the listener after a short delay to avoid memory leaks
          setTimeout(() => {
            unsubscribe();
          }, 1000);
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
        // Fallback to auth screen if there's an error
        router.replace("/auth");
      }
    };

    checkAuthStatus();
  }, []);

  return null;
}
