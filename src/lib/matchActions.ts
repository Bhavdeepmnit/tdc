import {
  doc,
  setDoc,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore';
import { CustomerStatus, type Activity } from '@types';
import { CUSTOMERS } from '@data/customers';
import { useAppStore } from '@store/useAppStore';
import { getDb, USE_MOCK_DATA } from '@lib/firebase';

/**
 * Match lifecycle actions — sending an introduction and passing on a candidate.
 *
 * Each action updates the Zustand store immediately (so the UI reflects the
 * change without a round-trip) and, in live mode, persists to Firestore. In
 * mock mode the Firestore write is skipped and a short delay simulates network
 * latency so the "Sending…" state is visible.
 */

const fullName = (id: string): string => {
  const c = CUSTOMERS.find((x) => x.id === id);
  return c ? `${c.firstName} ${c.lastName}` : 'this client';
};

/** Browser-safe unique id for activity/log entries. */
function uid(prefix: string): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  return `${prefix}_${rand}`;
}

/**
 * Send a match introduction.
 *
 * - Writes the match to the `matches` collection (status SENT).
 * - Promotes the client to MATCHED if this is their first sent match.
 * - Appends an activity-log entry.
 *
 * @param customerId     - the client the match is for
 * @param matchProfileId - the candidate being introduced
 * @param emailContent   - the (possibly edited) introduction email body
 * @param score          - combined compatibility score, 0–100
 * @param tier           - tier label (HIGH / MEDIUM / LOW)
 */
export async function sendMatch(
  customerId: string,
  matchProfileId: string,
  emailContent: string,
  score: number,
  tier: string,
): Promise<void> {
  const store = useAppStore.getState();
  const clientName = fullName(customerId);
  const candidateName = fullName(matchProfileId);
  const isFirstMatch = store.sentCountFor(customerId) === 0;

  if (!USE_MOCK_DATA) {
    const db = getDb();
    // Deterministic id ⇒ idempotent (re-sending updates the same doc).
    await setDoc(
      doc(db, 'matches', `${customerId}_${matchProfileId}`),
      {
        clientId: customerId,
        matchedProfileId: matchProfileId,
        score,
        tier,
        emailContent,
        status: 'SENT',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    if (isFirstMatch) {
      await updateDoc(doc(db, 'customers', customerId), { status: CustomerStatus.MATCHED });
    }
    await addDoc(collection(db, 'activities'), {
      type: 'MATCH_SENT',
      customerId,
      customerName: clientName,
      targetName: candidateName,
      message: `Match sent to ${candidateName}`,
      createdAt: serverTimestamp(),
    });
  } else {
    // Simulate the network so the "Sending introduction…" state is visible.
    await new Promise((r) => setTimeout(r, 900));
  }

  // ── Local state (instant UI feedback) ──
  store.recordSent(customerId, matchProfileId, score, tier);
  if (isFirstMatch) store.setCustomerStatus(customerId, CustomerStatus.MATCHED);

  const activity: Activity = {
    id: uid('act'),
    type: 'MATCH_SENT',
    customerId,
    customerName: clientName,
    targetName: candidateName,
    message: `Match sent to ${candidateName}`,
    createdAt: new Date().toISOString(),
  };
  store.addActivity(activity);
}

/**
 * Pass on (reject) a candidate so it won't surface in future match runs.
 *
 * @param customerId     - the client the match was for
 * @param matchProfileId - the candidate being passed on
 * @param reason         - optional free-text reason
 */
export async function rejectMatch(
  customerId: string,
  matchProfileId: string,
  reason?: string,
): Promise<void> {
  const store = useAppStore.getState();
  const candidateName = fullName(matchProfileId);

  if (!USE_MOCK_DATA) {
    const db = getDb();
    await setDoc(
      doc(db, 'rejections', `${customerId}_${matchProfileId}`),
      {
        clientId: customerId,
        rejectedProfileId: matchProfileId,
        reason: reason ?? null,
        createdAt: serverTimestamp(),
      },
      { merge: true },
    );
  }

  store.recordRejected(customerId, matchProfileId, reason);
  store.addActivity({
    id: uid('act'),
    type: 'MATCH_REJECTED',
    customerId,
    customerName: fullName(customerId),
    targetName: candidateName,
    message: `Passed on ${candidateName}`,
    createdAt: new Date().toISOString(),
  });
}
