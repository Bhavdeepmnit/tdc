/**
 * Firestore seed script — populates `customers` and `matchmakers`.
 *
 * WHAT IT DOES
 *   • Writes all 120 CustomerProfile records from `@data/customers`.
 *   • Creates the two matchmaker docs (mm_001 / mm_002).
 *   • Batches writes (≤ 500 ops per commit — Firestore's hard limit).
 *   • Logs per-batch progress.
 *   • Is IDEMPOTENT: every doc is written with a deterministic id via `set()`,
 *     so re-running overwrites in place rather than creating duplicates.
 *
 * HOW TO RUN (Node 20+, env loaded from .env.local):
 *     npx tsx --env-file=.env.local src/scripts/seedFirestore.ts
 *
 *   The Firebase *client* SDK is used (consistent with src/lib/firebase.ts), so
 *   your Firestore security rules must permit these writes — run against the
 *   Firebase emulator, or temporarily relax rules / authenticate as an admin.
 *   For an unauthenticated/CI seed, swap to `firebase-admin` (see note at foot).
 */
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  writeBatch,
  type Firestore,
  type DocumentData,
} from 'firebase/firestore';

import { CUSTOMERS } from '@data/customers';
import { MatchmakerRole, type Matchmaker } from '@types';

const FIRESTORE_BATCH_LIMIT = 500;

/** The two matchmakers referenced by `assignedMatchmakerId` in the dataset. */
const MATCHMAKERS: Matchmaker[] = [
  {
    id: 'mm_001',
    fullName: 'Priya Sharma',
    email: 'matchmaker1@tdc.com',
    role: MatchmakerRole.MATCHMAKER,
    createdAt: '2025-08-01T09:00:00.000Z',
  },
  {
    id: 'mm_002',
    fullName: 'Rohan Verma',
    email: 'matchmaker2@tdc.com',
    role: MatchmakerRole.MATCHMAKER,
    createdAt: '2025-08-01T09:00:00.000Z',
  },
];

/** Read the Firebase web config from the environment (VITE_* vars in .env.local). */
function firebaseConfigFromEnv() {
  const env = process.env;
  const cfg = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  };
  if (!cfg.apiKey || !cfg.projectId) {
    throw new Error(
      'Firebase config missing. Run with `--env-file=.env.local` and set VITE_FIREBASE_* vars.',
    );
  }
  return cfg;
}

/** A single pending write: target collection + doc id + payload. */
interface PendingWrite {
  collection: string;
  id: string;
  data: DocumentData;
}

/** Commit writes in chunks of ≤ 500, logging progress for each batch. */
async function commitInBatches(db: Firestore, writes: PendingWrite[], label: string): Promise<void> {
  const total = writes.length;
  let written = 0;
  for (let start = 0; start < total; start += FIRESTORE_BATCH_LIMIT) {
    const slice = writes.slice(start, start + FIRESTORE_BATCH_LIMIT);
    const batch = writeBatch(db);
    for (const w of slice) {
      // set() with a known id ⇒ idempotent upsert (re-runs overwrite, never duplicate).
      batch.set(doc(db, w.collection, w.id), w.data);
    }
    await batch.commit();
    written += slice.length;
    console.log(`  [${label}] committed ${written}/${total}`);
  }
}

async function main(): Promise<void> {
  console.log('▶ Seeding Firestore…');
  const app = initializeApp(firebaseConfigFromEnv());
  const db = getFirestore(app);

  // Strip the `id` out of the stored payload — it lives in the doc path, not the body.
  const matchmakerWrites: PendingWrite[] = MATCHMAKERS.map(({ id, ...rest }) => ({
    collection: 'matchmakers',
    id,
    data: rest,
  }));
  const customerWrites: PendingWrite[] = CUSTOMERS.map(({ id, ...rest }) => ({
    collection: 'customers',
    id,
    data: rest,
  }));

  console.log(`• matchmakers: ${matchmakerWrites.length} docs`);
  await commitInBatches(db, matchmakerWrites, 'matchmakers');

  console.log(`• customers: ${customerWrites.length} docs`);
  await commitInBatches(db, customerWrites, 'customers');

  console.log('✅ Seed complete.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  });

/*
 * ── firebase-admin variant (for CI / unauthenticated seeding) ──────────────
 * Install:  npm i -D firebase-admin
 * Replace the client init with:
 *
 *   import { initializeApp, cert } from 'firebase-admin/app';
 *   import { getFirestore } from 'firebase-admin/firestore';
 *   const app = initializeApp({ credential: cert(JSON.parse(process.env.SERVICE_ACCOUNT!)) });
 *   const db = getFirestore(app);
 *   // Admin batches use the same 500-op limit and a near-identical batch API.
 */
