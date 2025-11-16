import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Use Vite env variables (VITE_) in production; fall back to the provided defaults if env vars are not set.
// Replace the defaults below with your project's values or add the values to a `.env` file.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD3PUF4-vAsPvYNw-03qGZqqfFcg3Osa3k",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "zoophi-chat-lite.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "zoophi-chat-lite",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "zoophi-chat-lite.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "496737170680",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:496737170680:web:578e061f767289ab11370d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Configure auth
export const auth = getAuth(app);
auth.useDeviceLanguage();

// Configure storage
export const storage = getStorage(app);
