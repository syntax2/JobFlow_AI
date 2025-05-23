"use client";

import type { FirebaseApp } from 'firebase/app';
import { initializeApp, getApps, getApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged, type User } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { APP_ID, INITIAL_AUTH_TOKEN } from '@/constants';
import { GlobeLock } from 'lucide-react'; // For loading state

// Firebase configuration - replace with your actual config
// For Firebase Studio, __firebase_config should be globally available.
// Fallback to environment variables or a placeholder for local development if needed.
const firebaseConfig = (globalThis as any).__firebase_config || {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "your-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "your-auth-domain",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "your-storage-bucket",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "your-messaging-sender-id",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "your-app-id",
};

interface FirebaseContextType {
  app: FirebaseApp | null;
  auth: Auth | null;
  db: Firestore | null;
  user: User | null;
  userId: string | null;
  appId: string;
  loading: boolean;
  error: Error | null;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const useFirebase = (): FirebaseContextType => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

interface FirebaseProviderProps {
  children: ReactNode;
}

export const FirebaseProvider = ({ children }: FirebaseProviderProps): JSX.Element => {
  const [app, setApp] = useState<FirebaseApp | null>(null);
  const [auth, setAuth] = useState<Auth | null>(null);
  const [db, setDb] = useState<Firestore | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let firebaseApp: FirebaseApp;
    if (!getApps().length) {
      firebaseApp = initializeApp(firebaseConfig);
    } else {
      firebaseApp = getApp();
    }
    setApp(firebaseApp);

    const authInstance = getAuth(firebaseApp);
    setAuth(authInstance);

    const dbInstance = getFirestore(firebaseApp);
    setDb(dbInstance);

    const unsubscribe = onAuthStateChanged(
      authInstance,
      async (currentUser) => {
        setLoading(true);
        setError(null);
        if (currentUser) {
          setUser(currentUser);
          setUserId(currentUser.uid);
          setLoading(false);
        } else {
          // No user signed in, try to sign in with token or anonymously
          try {
            if (INITIAL_AUTH_TOKEN) {
              const userCredential = await signInWithCustomToken(authInstance, INITIAL_AUTH_TOKEN);
              setUser(userCredential.user);
              setUserId(userCredential.user.uid);
            } else {
              const userCredential = await signInAnonymously(authInstance);
              setUser(userCredential.user);
              // For anonymous users, if uid is not stable or preferred, generate one.
              // However, Firebase anonymous auth does provide a stable UID.
              setUserId(userCredential.user.uid || crypto.randomUUID());
            }
          } catch (e: any) {
            console.error("Firebase Authentication Error:", e);
            setError(e);
            // Fallback to a random UUID if anonymous sign-in also fails, though this is unlikely
            // and means data won't be persisted correctly under a Firebase user.
            // This path indicates a serious configuration problem.
            setUser(null);
            setUserId(crypto.randomUUID()); // Or handle error more gracefully
          } finally {
            setLoading(false);
          }
        }
      },
      (authError) => {
        console.error("Firebase onAuthStateChanged error:", authError);
        setError(authError);
        setLoading(false);
        // Critical error in auth, potentially set a fallback UUID for UI to somewhat function
        // but operations requiring auth will fail.
        setUserId(crypto.randomUUID());
      }
    );

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
        <GlobeLock className="w-16 h-16 mb-4 animate-spin text-primary" />
        <p className="text-lg">Initializing CareerCompass AI...</p>
        <p className="text-sm text-muted-foreground">Connecting to secure services.</p>
      </div>
    );
  }

  if (error && !user) { // Only show critical error if user couldn't be established
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-destructive-foreground p-4">
        <GlobeLock className="w-16 h-16 mb-4 text-destructive" />
        <h1 className="text-2xl font-semibold mb-2">Initialization Failed</h1>
        <p className="text-center mb-4">Could not connect to essential services. Please check your configuration or network connection.</p>
        <pre className="text-xs bg-destructive/20 p-2 rounded-md overflow-auto max-w-md">
          {error.message}
        </pre>
      </div>
    );
  }


  return (
    <FirebaseContext.Provider value={{ app, auth, db, user, userId, appId: APP_ID, loading, error }}>
      {children}
    </FirebaseContext.Provider>
  );
};
