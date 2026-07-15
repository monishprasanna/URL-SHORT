import { initializeApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || '',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.VITE_FIREBASE_APP_ID || '',
};

let firebaseApp: any = null;
let db: Firestore | null = null;

export const isFirebaseConfigured = (): boolean => {
  return (
    !!process.env.VITE_FIREBASE_PROJECT_ID &&
    !!process.env.VITE_FIREBASE_API_KEY &&
    process.env.VITE_FIREBASE_PROJECT_ID !== '' &&
    process.env.VITE_FIREBASE_API_KEY !== ''
  );
};

if (isFirebaseConfigured()) {
  firebaseApp = initializeApp(firebaseConfig);
  db = getFirestore(firebaseApp);
}

export const getFirebaseApp = () => firebaseApp;
export const getFirestoreDb = () => db;

// Helper to explain setup if missing
export const getSetupInstructions = () => `
To enable persistent storage, create a Firebase project with Firestore:

1. Go to Firebase Console (https://console.firebase.google.com)
2. Create a new project or use existing one
3. Enable Firestore Database
4. Create a collection named 'urls'
5. Set security rules to allow public read/write (for demo) or add authentication

Collection Structure:
- Document ID: auto-generated
- Fields:
  - id: string (UUID)
  - original_url: string
  - short_code: string (indexed, unique constraint handled in app logic)
  - created_at: timestamp
  - clicks: number
  - title: string (nullable)

Then set environment variables in .env:
  VITE_FIREBASE_API_KEY=your_api_key
  VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
  VITE_FIREBASE_PROJECT_ID=your_project_id
  VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
  VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
  VITE_FIREBASE_APP_ID=your_app_id
`;
