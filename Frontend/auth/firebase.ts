// auth/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your Firebase config from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyAjV3Rnnx_RnYJWSThAg7uq89zisHcGCXM",
  authDomain: "expensely-95538.firebaseapp.com",
  projectId: "expensely-95538",
  storageBucket: "expensely-95538.firebasestorage.app",
  messagingSenderId: "595378920015",
  appId: "1:595378920015:web:383ca1d70136b7ad5d683a",
  measurementId: "G-BEZWH7BV5X"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { auth };
