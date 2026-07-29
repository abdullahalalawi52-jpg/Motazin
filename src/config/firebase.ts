import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
// Analytics is lazy-loaded
// Firebase configuration from environment variables (supports VITE_ prefix)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "missing",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "missing",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "missing",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "missing",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "missing",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "missing",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "missing",
};

// Validate that all required environment variables are set
const requiredEnvVars = [
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_APP_ID',
];

requiredEnvVars.forEach((name) => {
  const viteName = `VITE_${name}`;
  if (!import.meta.env[viteName]) {
    console.warn(`Missing environment variable: ${viteName}`);
  }
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export let analytics: unknown = null;

if (typeof window !== 'undefined' && import.meta.env.MODE === 'production') {
  import('firebase/analytics').then(({ getAnalytics, isSupported }) => {
    isSupported().then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    });
  }).catch((err) => console.warn('Failed to load Firebase Analytics', err));
}

export const googleProvider = new GoogleAuthProvider();

export default app;
