import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Runtime config from public/firebase-config.js (set via Admin Panel)
const runtimeConfig = (window as any).__FIREBASE_CONFIG__;

// Use runtime config if available and non-empty, otherwise fall back to .env
const firebaseConfig = {
    apiKey: runtimeConfig?.apiKey || import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: runtimeConfig?.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: runtimeConfig?.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: runtimeConfig?.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: runtimeConfig?.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: runtimeConfig?.appId || import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);

console.log("Firebase Initialized with Project:", firebaseConfig.projectId);
console.log("Config Source:", runtimeConfig?.projectId ? "Runtime (Admin Panel)" : "Environment (.env)");