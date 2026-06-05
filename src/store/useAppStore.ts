import { create } from 'zustand';
import type { Activity, CustomerProfile } from '@types';
import type { CustomerStatus } from '@types';
import { CUSTOMERS } from '@data/customers';
import { generateMatches, type ScoredMatch } from '@lib/matching';

/**
 * Global client-side store (Zustand) for customers, the computed match pool, and
 * match-action state (sent / rejected matches + the activity feed).
 *
 * In mock mode it hydrates from bundled data and persists action state to
 * localStorage so a demo survives refreshes; the same actions would call
 * Firestore in production (see `matchActions.ts`).
 */

/** Composite key for a (client → candidate) pairing. */
export const matchKey = (clientId: string, candidateId: string) => `${clientId}__${candidateId}`;

interface SentRecord {
  score: number;
  tier: string;
  sentAt: string;
}
interface RejectedRecord {
  reason?: string;
  rejectedAt: string;
}

/** Slice of state we persist to localStorage between sessions (mock demo). */
interface PersistedState {
  sentMatches: Record<string, SentRecord>;
  rejectedMatches: Record<string, RejectedRecord>;
  activities: Activity[];
  statusOverrides: Record<string, CustomerStatus>;
}

const STORAGE_KEY = 'tdc.matchState';
const MAX_ACTIVITIES = 50;

function loadPersisted(): PersistedState {
  const empty: PersistedState = {
    sentMatches: {},
    rejectedMatches: {},
    activities: [],
    statusOverrides: {},
  };
  if (typeof window === 'undefined') return empty;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...empty, ...(JSON.parse(raw) as PersistedState) } : empty;
  } catch {
    return empty;
  }
}

function savePersisted(state: PersistedState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota / private mode — non-fatal */
  }
}

interface AppState extends PersistedState {
  customers: CustomerProfile[];
  loadingCustomers: boolean;

  /** Scored matches computed for the most recently opened client. */
  matches: ScoredMatch[];
  loadingMatches: boolean;

  // ── Customer queries ──
  fetchCustomers: () => Promise<void>;
  getCustomerById: (id: string) => CustomerProfile | undefined;
  computeMatches: (clientId: string) => Promise<void>;

  // ── Match-action state ──
  isMatchSent: (clientId: string, candidateId: string) => boolean;
  isMatchRejected: (clientId: string, candidateId: string) => boolean;
  /** Number of matches already sent for a client (drives "first match" logic). */
  sentCountFor: (clientId: string) => number;
  recordSent: (clientId: string, candidateId: string, score: number, tier: string) => void;
  recordRejected: (clientId: string, candidateId: string, reason?: string) => void;
  setCustomerStatus: (customerId: string, status: CustomerStatus) => void;
  addActivity: (activity: Activity) => void;
  /** Most recent `n` activities (newest first). */
  recentActivities: (n?: number) => Activity[];
}

const persisted = loadPersisted();

export const useAppStore = create<AppState>((set, get) => ({
  customers: [],
  loadingCustomers: false,
  matches: [],
  loadingMatches: false,

  ...persisted,

  async fetchCustomers() {
    set({ loadingCustomers: true });
    // Simulate network latency for realistic skeleton states.
    await new Promise((r) => setTimeout(r, 350));
    set({ customers: CUSTOMERS, loadingCustomers: false });
  },

  getCustomerById(id) {
    return get().customers.find((c) => c.id === id);
  },

  async computeMatches(clientId) {
    set({ loadingMatches: true });
    if (get().customers.length === 0) await get().fetchCustomers();

    const pool = get().customers;
    const client = pool.find((c) => c.id === clientId);
    if (!client) {
      set({ matches: [], loadingMatches: false });
      return;
    }
    // Simulate AI processing latency.
    await new Promise((r) => setTimeout(r, 400));

    // Exclude candidates already passed on for this client.
    const rejected = get().rejectedMatches;
    const matches = generateMatches(client, pool).filter(
      (m) => !rejected[matchKey(clientId, m.profile.id)],
    );
    set({ matches, loadingMatches: false });
  },

  // ── Match-action state ──

  isMatchSent(clientId, candidateId) {
    return Boolean(get().sentMatches[matchKey(clientId, candidateId)]);
  },

  isMatchRejected(clientId, candidateId) {
    return Boolean(get().rejectedMatches[matchKey(clientId, candidateId)]);
  },

  sentCountFor(clientId) {
    const prefix = `${clientId}__`;
    return Object.keys(get().sentMatches).filter((k) => k.startsWith(prefix)).length;
  },

  recordSent(clientId, candidateId, score, tier) {
    set((s) => {
      const sentMatches = {
        ...s.sentMatches,
        [matchKey(clientId, candidateId)]: { score, tier, sentAt: new Date().toISOString() },
      };
      persist({ ...s, sentMatches });
      return { sentMatches };
    });
  },

  recordRejected(clientId, candidateId, reason) {
    set((s) => {
      const rejectedMatches = {
        ...s.rejectedMatches,
        [matchKey(clientId, candidateId)]: { reason, rejectedAt: new Date().toISOString() },
      };
      persist({ ...s, rejectedMatches });
      // Drop the rejected candidate from the currently-shown matches immediately.
      const matches = s.matches.filter((m) => m.profile.id !== candidateId);
      return { rejectedMatches, matches };
    });
  },

  setCustomerStatus(customerId, status) {
    set((s) => {
      const statusOverrides = { ...s.statusOverrides, [customerId]: status };
      // Reflect in the in-memory roster too (best-effort, mock demo).
      const customers = s.customers.map((c) =>
        c.id === customerId ? { ...c, status } : c,
      );
      persist({ ...s, statusOverrides });
      return { statusOverrides, customers };
    });
  },

  addActivity(activity) {
    set((s) => {
      const activities = [activity, ...s.activities].slice(0, MAX_ACTIVITIES);
      persist({ ...s, activities });
      return { activities };
    });
  },

  recentActivities(n = 5) {
    return get().activities.slice(0, n);
  },
}));

/** Persist only the serialisable action slice. */
function persist(s: PersistedState): void {
  savePersisted({
    sentMatches: s.sentMatches,
    rejectedMatches: s.rejectedMatches,
    activities: s.activities,
    statusOverrides: s.statusOverrides,
  });
}
