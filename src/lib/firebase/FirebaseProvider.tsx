// src/lib/context/firebase/FirebaseProvider.tsx

"use client";

import type { FirebaseApp } from "firebase/app";
import { initializeApp, getApps, getApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import {
  getAuth,
  signInWithCustomToken,
  signInAnonymously,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { APP_ID, INITIAL_AUTH_TOKEN } from "@/constants";
import { GlobeLock } from "lucide-react"; // For loading state

// Firebase configuration:
// In Firebase Studio and deployed Firebase Hosting environments,
// a global variable `__firebase_config` is typically injected by the platform.
// This provider will try to use that global configuration first.
// If `__firebase_config` is not found (e.g., in local development outside Studio),
// it falls back to environment variables (NEXT_PUBLIC_FIREBASE_*).
// We have REMOVED hardcoded placeholder values to ensure that configuration MUST come
// from environment variables or the injected global config for security and correctness.
const firebaseConfig = (globalThis as any).__firebase_config || {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY, // NO FALLBACK TO "your-api-key"
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, // NO FALLBACK
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, // NO FALLBACK
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, // NO FALLBACK
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, // NO FALLBACK
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID, // NO FALLBACK
};

interface FirebaseContextType {
  app: FirebaseApp | null; // The Firebase App instance.
  auth: Auth | null; // The Firebase Auth instance.
  db: Firestore | null; // The Firebase Firestore instance.
  user: User | null; // The currently authenticated Firebase User object, or null if no user.
  userId: string | null; // The UID of the authenticated user, or a fallback UUID.
  appId: string; // The internal application identifier (from constants).
  loading: boolean; // True while Firebase is initializing and authenticating.
  error: Error | null; // Any error encountered during initialization or authentication.
}

// Create a React Context for Firebase services and user state.
const FirebaseContext = createContext<FirebaseContextType | undefined>(
  undefined
);

// Custom hook to easily access the Firebase context.
// Custom hook to easily access the Firebase context.
export const useFirebase = (): FirebaseContextType => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error("useFirebase must be used within a FirebaseProvider");
  }
  return context;
};

interface FirebaseProviderProps {
  children: ReactNode;
}

// FirebaseProvider component: Initializes Firebase and manages authentication state.
export const FirebaseProvider = ({
  children,
}: FirebaseProviderProps): JSX.Element => {
  // State for Firebase services
  const [app, setApp] = useState<FirebaseApp | null>(null);
  const [auth, setAuth] = useState<Auth | null>(null);
  const [db, setDb] = useState<Firestore | null>(null);
  // State for user and authentication status
  // State for user and authentication status
  const [user, setUser] = useState<User | null>(null);
  const [userId, setUserId] = useState<string | null>(null); // Can be Firebase UID or a fallback
  const [userId, setUserId] = useState<string | null>(null); // Can be Firebase UID or a fallback
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let firebaseApp: FirebaseApp;
    try {
      // Check if Firebase configuration is valid before initializing
      if (!firebaseConfig.apiKey) {
        throw new Error(
          "Firebase API Key is missing. Please check .env.local or injected config."
        );
      }
      if (!firebaseConfig.projectId) {
        throw new Error(
          "Firebase Project ID is missing. Please check .env.local or injected config."
        );
      }
      // You can add more checks for other critical fields if desired.

      // Initialize Firebase App. If already initialized, get the existing app.
      if (!getApps().length) {
        firebaseApp = initializeApp(firebaseConfig);
      } else {
        firebaseApp = getApp();
      }
      setApp(firebaseApp);

      // Get Firebase Auth and Firestore instances.
      const authInstance = getAuth(firebaseApp);
      setAuth(authInstance);
      const dbInstance = getFirestore(firebaseApp);
      setDb(dbInstance);

      // Subscribe to Firebase authentication state changes.
      // This listener is called when the user signs in, signs out, or the token changes.
      const unsubscribe = onAuthStateChanged(
        authInstance,
        async (currentUser) => {
          setLoading(true); // Set loading to true while determining auth state
          setError(null); // Clear previous errors
          if (currentUser) {
            // User is signed in.
            setUser(currentUser);
            setUserId(currentUser.uid); // Use Firebase UID.
            setLoading(false);
          } else {
            // No user is signed in. Attempt to sign in based on INITIAL_AUTH_TOKEN or anonymously.
            try {
              if (INITIAL_AUTH_TOKEN) {
                // If an initial auth token is provided (e.g., for specific integrations), use it.
                const userCredential = await signInWithCustomToken(
                  authInstance,
                  INITIAL_AUTH_TOKEN
                );
                setUser(userCredential.user);
                setUserId(userCredential.user.uid);
              } else {
                // Otherwise, sign in anonymously. This allows users to use the app without an account.
                // Data will be tied to this anonymous user's UID.
                const userCredential = await signInAnonymously(authInstance);
                setUser(userCredential.user);
                setUserId(userCredential.user.uid); // Firebase anonymous auth provides a stable UID.
              }
            } catch (e: any) {
              console.error(
                "Firebase Authentication Error (signInAnonymously or signInWithCustomToken):",
                e
              );
              setError(e);
              // Fallback: If all auth attempts fail, generate a random UUID.
              // This allows the UI to function minimally but data persistence might be impaired or local-only.
              // This state usually indicates a significant configuration issue with Firebase.
              setUser(null);
              setUserId(crypto.randomUUID());
            } finally {
              setLoading(false); // Authentication attempt finished
            }
          }
        },
        (authError) => {
          // This callback handles errors during the onAuthStateChanged listener setup or operation.
          console.error("Firebase onAuthStateChanged error:", authError);
          setError(authError);
          setLoading(false);
          // Critical error in auth. Provide a fallback UUID for the UI to attempt to function.
          // Operations requiring a stable, authenticated Firebase user will likely fail.
          setUserId(crypto.randomUUID());
        }
      );

      // Cleanup: Unsubscribe from the auth state listener when the component unmounts.
      return () => unsubscribe();
    } catch (e: any) {
      // Catch errors during Firebase initialization itself (e.g., missing API key)
      console.error("Firebase Initialization Error:", e);
      setError(e);
      setLoading(false);
      setUserId(crypto.randomUUID()); // Fallback UUID if Firebase fails to initialize
    }
  }, []); // Empty dependency array ensures this effect runs only once on mount.

  // Display a loading screen while Firebase is initializing.
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
        <GlobeLock className="w-16 h-16 mb-4 animate-spin text-primary" />
        <p className="text-lg">Initializing CareerCompass AI...</p>
        <p className="text-sm text-muted-foreground">
          Connecting to secure services.
        </p>
      </div>
    );
  }

  // Display an error screen if a critical error occurred and no user could be established.
  if (error && !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-destructive-foreground p-4">
        <GlobeLock className="w-16 h-16 mb-4 text-destructive" />
        <h1 className="text-2xl font-semibold mb-2">Initialization Failed</h1>
        <p className="text-center mb-4">
          Could not connect to essential services. Please check your
          configuration or network connection.
        </p>
        <pre className="text-xs bg-destructive/20 p-2 rounded-md overflow-auto max-w-md">
          Error: {error.message}
          Error: {error.message}
        </pre>
      </div>
    );
  }

  // Provide the Firebase context to children components.
  // Provide the Firebase context to children components.
  return (
    <FirebaseContext.Provider
      value={{ app, auth, db, user, userId, appId: APP_ID, loading, error }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};
