import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { config } from './config';

// Lazy initialization
let firebaseApp: any = null;
let adminAuthInstance: any = null;

function initializeFirebase() {
  // Development mode bypass
  if (config.firebase.skipAuth) {
    console.log('🚧 Firebase Auth disabled in development mode');
    return { app: null, auth: null };
  }

  // Environment validation
  if (!config.firebase.projectId) {
    throw new Error('Missing FIREBASE_PROJECT_ID environment variable');
  }

  if (firebaseApp && adminAuthInstance) {
    return { app: firebaseApp, auth: adminAuthInstance };
  }

  try {
    // Check if app is already initialized
    if (config.firebase.useADC) {
      // Use Application Default Credentials (for GCP environments)
      firebaseApp =
        getApps().length === 0
          ? initializeApp({
              projectId: config.firebase.projectId,
            })
          : getApp();
    } else {
      // Use explicit service account credentials
      if (!config.firebase.adminConfigured) {
        throw new Error('Missing Firebase admin credentials (FIREBASE_CLIENT_EMAIL or FIREBASE_PRIVATE_KEY)');
      }

      firebaseApp =
        getApps().length === 0
          ? initializeApp({
              credential: cert({
                projectId: config.firebase.projectId,
                clientEmail: config.firebase.clientEmail,
                privateKey: config.firebase.privateKey,
              }),
            })
          : getApp();
    }

    adminAuthInstance = getAuth(firebaseApp);

    return { app: firebaseApp, auth: adminAuthInstance };
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    throw new Error('Failed to initialize Firebase Admin SDK');
  }
}

// Lazy-loaded auth instance
export function getAdminAuth() {
  const { auth } = initializeFirebase();
  if (!auth && config.firebase.devMode) {
    console.log('🚧 Firebase Auth bypassed in development mode');
    return null;
  }
  return auth;
}

// Helper functions for dealer authentication
export interface DecodedToken {
  uid: string;
  email?: string;
  email_verified?: boolean;
  admin?: boolean;
  dealer?: boolean;
}

export async function verifyIdToken(idToken: string): Promise<DecodedToken> {
  // Development mode bypass
  if (config.firebase.devMode) {
    return {
      uid: 'dev-user-123',
      email: 'admin@dev.local',
      email_verified: true,
      admin: true,
      dealer: false,
    };
  }

  try {
    const adminAuth = getAdminAuth();
    if (!adminAuth) throw new Error('Firebase Auth not initialized');
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return decodedToken as DecodedToken;
  } catch (error) {
    console.error('Token verification error:', error);
    throw new Error('Invalid or expired token');
  }
}

export async function getUserById(uid: string) {
  try {
    const adminAuth = getAdminAuth();
    return await adminAuth.getUser(uid);
  } catch (error) {
    console.error('Get user error:', error);
    throw new Error('User not found');
  }
}

export async function createCustomToken(uid: string, additionalClaims?: object) {
  try {
    const adminAuth = getAdminAuth();
    return await adminAuth.createCustomToken(uid, additionalClaims);
  } catch (error) {
    console.error('Create custom token error:', error);
    throw new Error('Failed to create custom token');
  }
}

export async function setCustomUserClaims(uid: string, customClaims: object) {
  try {
    const adminAuth = getAdminAuth();
    await adminAuth.setCustomUserClaims(uid, customClaims);
  } catch (error) {
    console.error('Set custom claims error:', error);
    throw new Error('Failed to set custom claims');
  }
}

// Middleware helper for protected routes
export async function validateAdminToken(authorization?: string): Promise<DecodedToken> {
  // Development mode bypass
  if (config.firebase.devMode) {
    return {
      uid: 'dev-admin-123',
      email: 'admin@dev.local',
      email_verified: true,
      admin: true,
      dealer: false,
    };
  }

  if (!authorization || !authorization.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }

  const token = authorization.split('Bearer ')[1];
  const decodedToken = await verifyIdToken(token);

  // Check if user has admin privileges
  if (!decodedToken.admin && !decodedToken.dealer) {
    throw new Error('Insufficient privileges');
  }

  return decodedToken;
}

// Firebase client configuration for frontend
export const firebaseConfig = {
  apiKey: config.firebase.apiKey,
  authDomain: `${config.firebase.projectId}.firebaseapp.com`,
  projectId: config.firebase.projectId,
  storageBucket: `${config.firebase.projectId}.appspot.com`,
  messagingSenderId: config.firebase.messagingSenderId,
  appId: config.firebase.appId,
};
