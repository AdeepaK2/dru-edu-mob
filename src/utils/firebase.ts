import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  Firestore, 
  initializeFirestore,
  CACHE_SIZE_UNLIMITED
} from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration - using same project as dru-edu
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Firestore database ID - must match the web app (production database)
const FIRESTORE_DATABASE_ID = process.env.EXPO_PUBLIC_FIRESTORE_DATABASE_ID || 'production';

// Initialize Firebase
let app: FirebaseApp;
let firestore: Firestore;
let auth: Auth;
let storage: FirebaseStorage;

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  // Initialize Firestore with simpler config for React Native
  try {
    firestore = initializeFirestore(app, {
      cacheSizeBytes: CACHE_SIZE_UNLIMITED,
    }, FIRESTORE_DATABASE_ID);
  } catch (e) {
    // If already initialized, get the existing instance
    firestore = getFirestore(app, FIRESTORE_DATABASE_ID);
  }

  // Initialize Auth with AsyncStorage persistence
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  } catch (e) {
    // Auth might already be initialized
    const { getAuth } = require('firebase/auth');
    auth = getAuth(app);
  }

  storage = getStorage(app);
} catch (error) {
  console.error('Firebase initialization error:', error);
  // Create fallback instances to prevent crashes
  app = getApps()[0] || initializeApp(firebaseConfig);
  firestore = getFirestore(app, FIRESTORE_DATABASE_ID);
  const { getAuth } = require('firebase/auth');
  auth = getAuth(app);
  storage = getStorage(app);
}

export { app, firestore, auth, storage };
