import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "YOUR-API-KEY",
  authDomain: "YOUR-DOMAIN.firebaseapp.com",
  projectId: "YOUR-PROJECT-ID",
  storageBucket: "YOUR-PROJECT.appspot.com",
  messagingSenderId: "YOUR-SENDER-ID",
  appId: "YOUR-APP-ID",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };
