import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, initializeFirestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';

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

// Validate config
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.warn('Firebase config missing. Please check EXPO_PUBLIC_FIREBASE_* environment variables.');
}

// Initialize Firebase
let app: FirebaseApp;
let firestore: Firestore;
let auth: Auth;
let storage: FirebaseStorage;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Connect to the correct Firestore database (production)
// Use initializeFirestore to specify database ID
try {
  firestore = initializeFirestore(app, {}, FIRESTORE_DATABASE_ID);
  console.log('Firebase: Connected to Firestore database:', FIRESTORE_DATABASE_ID);
} catch (e) {
  // If already initialized, get the existing instance
  firestore = getFirestore(app, FIRESTORE_DATABASE_ID);
  console.log('Firebase: Using existing Firestore instance for database:', FIRESTORE_DATABASE_ID);
}

auth = getAuth(app);
storage = getStorage(app);

export { app, firestore, auth, storage };
