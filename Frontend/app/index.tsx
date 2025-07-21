import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect } from "react";
import { auth } from "../auth/firebase";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace("/(tabs)/dashboard");
      } else {
        router.replace("/auth");
      }
    });
    return () => unsubscribe();
  }, []);

  return null;
}
