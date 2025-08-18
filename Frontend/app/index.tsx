import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../auth/firebase"; // ✅ using your new Firebase setup
import { getStoredToken, getStoredUser, storeToken } from "../utils/storage";
import axios from "axios";
import Constants from "expo-constants";
import { useDispatch } from "react-redux";
import { triggerRefresh } from "@/hooks/redux/dashboardSlice";

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

export default function Index() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Auth state changed:", firebaseUser);
      if (!isMounted || checked) return;

      if (firebaseUser && firebaseUser.emailVerified) {
        let storedToken = await getStoredToken();
        const storedUser = await getStoredUser();

        if (storedToken && storedUser) {
          const valid = await validateToken(storedToken);
          if (valid) {
            if (isMounted) {
              setChecked(true);
              dispatch(triggerRefresh());
              router.replace("/(tabs)/dashboard");
            }
            return;
          }
        }

        // Try coldSignIn if token invalid or missing
        try {
          const refreshedToken = await firebaseUser.getIdToken(true);
          await storeToken(refreshedToken);
          const validAfter = await validateToken(refreshedToken);
          if (validAfter) {
            dispatch(triggerRefresh());
            router.replace("/(tabs)/dashboard");
            return;
          }
        } catch (err) {
          console.error("Token refresh failed", err);
        }
      }

      // Redirect to login if not authenticated or all validation failed
      if (isMounted) {
        setChecked(true);
        dispatch(triggerRefresh());
        router.replace("/auth");
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [checked]);

  return null;
}
