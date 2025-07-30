// auth/firebase.ts
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

// Your Firebase config from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyAjV3Rnnx_RnYJWSThAg7uq89zisHcGCXM",
  authDomain: "expensely-95538.firebaseapp.com",
  projectId: "expensely-95538",
  storageBucket: "expensely-95538.firebasestorage.app",
  messagingSenderId: "595378920015",
  appId: "1:595378920015:web:383ca1d70136b7ad5d683a",
  measurementId: "G-BEZWH7BV5X",
};

export const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});
