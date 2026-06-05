import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  browserLocalPersistence,
  browserSessionPersistence,
  getAuth,
  setPersistence,
  type Auth,
} from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

/**
 * Firebase bootstrap (modular v9+ SDK).
 *
 * Config values are read from `import.meta.env` — they are public by design
 * (Firebase security is enforced by Firestore Rules + Auth, not by hiding keys).
 * The Anthropic key is NOT here; it stays on the serverless proxy (see claude.ts).
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

/** Whether the app should run against bundled mock data instead of live Firestore. */
export const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true';

/**
 * Lazily initialise Firebase only when we actually need it (i.e. not in mock mode).
 * Avoids noisy console errors when env vars are intentionally absent during local
 * mock-data development.
 */
let _app: FirebaseApp | undefined;
let _auth: Auth | undefined;
let _db: Firestore | undefined;

function ensureApp(): FirebaseApp {
  if (!_app) {
    if (!firebaseConfig.apiKey) {
      throw new Error(
        'Firebase config missing. Set VITE_FIREBASE_* env vars or enable VITE_USE_MOCK_DATA=true.',
      );
    }
    _app = initializeApp(firebaseConfig);
  }
  return _app;
}

/** The shared Firebase Auth instance. */
export function getFirebaseAuth(): Auth {
  if (!_auth) _auth = getAuth(ensureApp());
  return _auth;
}

/** The shared Firestore database instance. */
export function getDb(): Firestore {
  if (!_db) _db = getFirestore(ensureApp());
  return _db;
}

/**
 * Choose how long the auth session survives.
 * - `remember = true`  → `browserLocalPersistence` (persists across browser restarts).
 * - `remember = false` → `browserSessionPersistence` (cleared when the tab closes).
 *
 * Must be called *before* `signInWithEmailAndPassword`.
 */
export function configureAuthPersistence(remember: boolean): Promise<void> {
  return setPersistence(
    getFirebaseAuth(),
    remember ? browserLocalPersistence : browserSessionPersistence,
  );
}
