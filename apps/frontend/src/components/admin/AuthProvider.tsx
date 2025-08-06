'use client';

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { createContext, useContext, useEffect, useState } from 'react';
import { config } from '@/lib/config';

// Firebase client configuration
const firebaseConfig = {
  apiKey: config.firebase.apiKey || 'demo-key',
  authDomain: `${config.firebase.projectId || 'demo-project'}.firebaseapp.com`,
  projectId: config.firebase.projectId || 'demo-project',
  storageBucket: `${config.firebase.projectId || 'demo-project'}.appspot.com`,
  messagingSenderId: config.firebase.messagingSenderId || '123456789',
  appId: config.firebase.appId || 'demo-app-id',
};

// Lazy initialization
let app: any = null;
let auth: any = null;

function initializeFirebase() {
  if (typeof window === 'undefined') return null; // Server-side

  if (!app) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
  }

  return { app, auth };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
  getIdToken: async () => null,
});

export function useAuth() {
  return useContext(AuthContext);
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Development mode bypass
    if (
      config.environment === 'development' &&
      config.firebase.devMode
    ) {
      // Create a mock user for development
      const mockUser = {
        uid: 'dev-admin-123',
        email: 'admin@dev.local',
        emailVerified: true,
        displayName: 'Development Admin',
        getIdToken: async () => 'dev-token-123',
      } as any;

      setUser(mockUser);
      setLoading(false);
      return;
    }

    const firebase = initializeFirebase();
    if (!firebase) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(firebase.auth, user => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const firebase = initializeFirebase();
    if (!firebase) throw new Error('Firebase not initialized');

    try {
      await signInWithEmailAndPassword(firebase.auth, email, password);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signOutUser = async () => {
    const firebase = initializeFirebase();
    if (!firebase) throw new Error('Firebase not initialized');

    try {
      await signOut(firebase.auth);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const getIdToken = async () => {
    // Development mode bypass
    if (
      config.environment === 'development' &&
      config.firebase.devMode
    ) {
      return 'dev-token-123';
    }

    if (!user) return null;
    try {
      return await user.getIdToken();
    } catch (error) {
      console.error('Get ID token error:', error);
      return null;
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signOut: signOutUser,
    getIdToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
