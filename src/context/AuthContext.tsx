import { createContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import { MatchmakerRole, type Matchmaker } from '@types';
import { configureAuthPersistence, getFirebaseAuth, USE_MOCK_DATA } from '@lib/firebase';

/** Shape of the authenticated session exposed to the app. */
export interface AuthContextValue {
  /** The signed-in matchmaker, or `null` when logged out. */
  user: Matchmaker | null;
  /** True while the initial auth state is being resolved. */
  loading: boolean;
  /**
   * Sign in with email + password. Throws on failure (caller shows the toast).
   * @param rememberMe - persist across browser restarts (local) vs tab session.
   */
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  /** Sign the current user out. */
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/** localStorage key used to persist the mock session. */
const MOCK_SESSION_KEY = 'tdc.mockAuth';

/** Derive a matchmaker's role from their email (admins use the admin@ inbox). */
function roleForEmail(email: string): MatchmakerRole {
  return email.toLowerCase().startsWith('admin@')
    ? MatchmakerRole.ADMIN
    : MatchmakerRole.MATCHMAKER;
}

/** Map a Firebase user to our domain Matchmaker. In a real app, enrich from Firestore. */
function toMatchmaker(fbUser: FirebaseUser): Matchmaker {
  const email = fbUser.email ?? '';
  return {
    id: fbUser.uid,
    fullName: fbUser.displayName ?? email.split('@')[0] ?? 'Matchmaker',
    email,
    role: roleForEmail(email),
    avatarUrl: fbUser.photoURL ?? undefined,
    createdAt: fbUser.metadata.creationTime ?? new Date().toISOString(),
  };
}

/** Build a mock matchmaker for a given email (used only when VITE_USE_MOCK_DATA=true). */
function mockUserFor(email: string): Matchmaker {
  const normalized = email.trim().toLowerCase() || 'priya@thedatecrew.com';
  return {
    id: `mm_mock_${normalized}`,
    fullName: normalized.split('@')[0].replace(/[._]/g, ' ') || 'Matchmaker',
    email: normalized,
    role: roleForEmail(normalized),
    createdAt: new Date().toISOString(),
  };
}

/**
 * Provides authentication state + actions to the tree.
 * In mock mode (`VITE_USE_MOCK_DATA=true`) it bypasses Firebase entirely and
 * accepts any credentials, so the dashboard is explorable out of the box.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Matchmaker | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (USE_MOCK_DATA) {
      // Restore a mock session: localStorage (remember me) or sessionStorage (tab-only).
      const raw =
        localStorage.getItem(MOCK_SESSION_KEY) ?? sessionStorage.getItem(MOCK_SESSION_KEY);
      setUser(raw ? (JSON.parse(raw) as Matchmaker) : null);
      setLoading(false);
      return;
    }

    // Firebase resolves the persisted session and notifies us here.
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), (fbUser) => {
      setUser(fbUser ? toMatchmaker(fbUser) : null);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      async login(email: string, password: string, rememberMe = true) {
        if (USE_MOCK_DATA) {
          if (!email || !password) throw new Error('Please enter email and password.');
          const mockUser = mockUserFor(email);
          // Honour "remember me": localStorage survives restarts; otherwise the
          // session lives only for this tab (mirrors Firebase persistence modes).
          const store = rememberMe ? localStorage : sessionStorage;
          store.setItem(MOCK_SESSION_KEY, JSON.stringify(mockUser));
          setUser(mockUser);
          return;
        }
        // Set persistence BEFORE sign-in so the session is stored correctly.
        await configureAuthPersistence(rememberMe);
        await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
        // `onAuthStateChanged` will update `user`.
      },
      async logout() {
        if (USE_MOCK_DATA) {
          localStorage.removeItem(MOCK_SESSION_KEY);
          sessionStorage.removeItem(MOCK_SESSION_KEY);
          setUser(null);
          return;
        }
        await signOut(getFirebaseAuth());
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
