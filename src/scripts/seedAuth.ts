/* eslint-disable no-console */
/**
 * Seed script — provisions demo auth users + their client rosters in Firebase.
 *
 * Creates (idempotently):
 *   • matchmaker1@tdc.com / TDC@2024      → role: matchmaker, 15 customers
 *   • matchmaker2@tdc.com / TDC@2024      → role: matchmaker, 12 customers
 *   • admin@tdc.com       / TDCAdmin@2024 → role: admin, oversees all
 *
 * Roles are written as Firebase custom claims (for Security Rules) AND as a
 * `matchmakers/{uid}` Firestore document.
 *
 * ── Usage ──────────────────────────────────────────────────────────────
 *   1. Create a service account key in the Firebase console
 *      (Project Settings → Service accounts → Generate new private key).
 *   2. Point GOOGLE_APPLICATION_CREDENTIALS at it, OR drop the JSON at
 *      ./serviceAccountKey.json in the project root.
 *   3. Run:  npm run seed:auth
 *
 * This is a Node-only script (Firebase Admin SDK) — it is never bundled into
 * the client app.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cert, getApps, initializeApp, type ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import {
  CustomerStatus,
  Diet,
  FamilyType,
  FamilyValues,
  Gender,
  Habit,
  ManglikStatus,
  MaritalStatus,
  MatchmakerRole,
  ViewsOnChildren,
  type Customer,
} from '../types';

// ── Demo account definitions ──────────────────────────────────────────────
interface DemoAccount {
  email: string;
  password: string;
  fullName: string;
  role: MatchmakerRole;
  customerCount: number;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: 'matchmaker1@tdc.com',
    password: 'TDC@2024',
    fullName: 'Priya Sharma',
    role: MatchmakerRole.MATCHMAKER,
    customerCount: 15,
  },
  {
    email: 'matchmaker2@tdc.com',
    password: 'TDC@2024',
    fullName: 'Rahul Verma',
    role: MatchmakerRole.MATCHMAKER,
    customerCount: 12,
  },
  {
    email: 'admin@tdc.com',
    password: 'TDCAdmin@2024',
    fullName: 'Anjali Desai',
    role: MatchmakerRole.ADMIN,
    customerCount: 0,
  },
];

// ── Admin SDK bootstrap ─────────────────────────────────────────────────────
/** Initialise firebase-admin from GOOGLE_APPLICATION_CREDENTIALS or a local key. */
function initAdmin(): void {
  if (getApps().length > 0) return;

  const localKeyPath = resolve(process.cwd(), 'serviceAccountKey.json');
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // The SDK reads the env var automatically.
    initializeApp();
  } else if (existsSync(localKeyPath)) {
    const serviceAccount = JSON.parse(readFileSync(localKeyPath, 'utf8')) as ServiceAccount;
    initializeApp({ credential: cert(serviceAccount) });
  } else {
    throw new Error(
      'No credentials found. Set GOOGLE_APPLICATION_CREDENTIALS or add ./serviceAccountKey.json.',
    );
  }
}

// ── Customer data generator ──────────────────────────────────────────────────
const FIRST_NAMES_MALE = ['Aarav', 'Vivaan', 'Reyansh', 'Arjun', 'Kabir', 'Dev', 'Aryan', 'Ishaan'];
const FIRST_NAMES_FEMALE = ['Ananya', 'Diya', 'Saanvi', 'Aadhya', 'Myra', 'Anika', 'Kiara', 'Riya'];
const SURNAMES = ['Mehta', 'Kapoor', 'Iyer', 'Nair', 'Reddy', 'Malhotra', 'Joshi', 'Rao', 'Khan'];
const CITIES = ['Mumbai', 'Delhi', 'Bengaluru', 'Pune', 'Hyderabad', 'Chennai', 'Gurugram'];
const RELIGIONS = ['Hindu', 'Muslim', 'Sikh', 'Jain', 'Christian'];
const PROFESSIONS = [
  'Software Engineer',
  'Doctor',
  'Chartered Accountant',
  'Product Manager',
  'Architect',
  'Lawyer',
  'Consultant',
];
const EDUCATIONS = ['B.Tech', 'MBBS', 'MBA', 'CA', 'M.Tech', 'B.Des', 'LLB'];

/** Pick a random element from an array. */
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Pick a random enum value. */
function pickEnum<E extends Record<string, string>>(e: E): E[keyof E] {
  const values = Object.values(e) as E[keyof E][];
  return pick(values);
}

/** Random integer in [min, max]. */
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Generate a single, fully-valid Customer assigned to a matchmaker. */
function generateCustomer(matchmakerId: string, index: number): Customer {
  const gender = index % 2 === 0 ? Gender.MALE : Gender.FEMALE;
  const firstName = gender === Gender.MALE ? pick(FIRST_NAMES_MALE) : pick(FIRST_NAMES_FEMALE);
  const fullName = `${firstName} ${pick(SURNAMES)}`;
  const status = pickEnum(CustomerStatus);
  const birthYear = 2026 - randInt(26, 36);
  const income = randInt(12, 60);

  return {
    id: `${matchmakerId}_cust_${String(index).padStart(2, '0')}`,
    matchmakerId,
    fullName,
    gender,
    dateOfBirth: `${birthYear}-${String(randInt(1, 12)).padStart(2, '0')}-${String(randInt(1, 28)).padStart(2, '0')}`,
    heightCm: gender === Gender.MALE ? randInt(168, 188) : randInt(152, 172),
    avatarUrl: `https://i.pravatar.cc/200?u=${matchmakerId}_${index}`,
    community: {
      religion: pick(RELIGIONS),
      caste: pick(['Agarwal', 'Brahmin', 'Khatri', 'Reddy', 'Nair']),
      motherTongue: pick(['Hindi', 'Tamil', 'Telugu', 'Punjabi', 'Marathi']),
    },
    manglikStatus: pickEnum(ManglikStatus),
    lifestyle: {
      diet: pickEnum(Diet),
      smoking: pickEnum(Habit),
      drinking: pickEnum(Habit),
    },
    career: {
      education: pick(EDUCATIONS),
      profession: pick(PROFESSIONS),
      incomeBracket: `${income}-${income + 6} LPA`,
      incomeLPA: income,
    },
    location: { currentCity: pick(CITIES), relocationWillingness: Math.random() > 0.5 },
    family: { familyType: pickEnum(FamilyType), familyValues: pickEnum(FamilyValues) },
    relationship: {
      maritalStatus: pickEnum(MaritalStatus),
      hasChildren: 'NO',
      viewsOnChildren: pickEnum(ViewsOnChildren),
    },
    status,
    isActive: status !== CustomerStatus.CLOSED && status !== CustomerStatus.ON_HOLD,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ── Seeding ─────────────────────────────────────────────────────────────────
/** Create (or fetch) an auth user, then write claims + matchmaker doc + customers. */
async function seedAccount(account: DemoAccount): Promise<void> {
  const auth = getAuth();
  const db = getFirestore();

  // 1. Create the auth user (idempotent: reuse if it already exists).
  let uid: string;
  try {
    const created = await auth.createUser({
      email: account.email,
      password: account.password,
      displayName: account.fullName,
      emailVerified: true,
    });
    uid = created.uid;
    console.log(`  ✓ created auth user ${account.email}`);
  } catch (err) {
    if ((err as { code?: string }).code === 'auth/email-already-exists') {
      uid = (await auth.getUserByEmail(account.email)).uid;
      // Reset the password so the documented demo credentials always work.
      await auth.updateUser(uid, { password: account.password, displayName: account.fullName });
      console.log(`  ↻ updated existing user ${account.email}`);
    } else {
      throw err;
    }
  }

  // 2. Role as a custom claim (consumed by Firestore Security Rules).
  await auth.setCustomUserClaims(uid, { role: account.role });

  // 3. matchmakers/{uid} profile document.
  await db.collection('matchmakers').doc(uid).set(
    {
      id: uid,
      fullName: account.fullName,
      email: account.email,
      role: account.role,
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  // 4. Customer roster (batched writes).
  if (account.customerCount > 0) {
    const batch = db.batch();
    for (let i = 1; i <= account.customerCount; i++) {
      const customer = generateCustomer(uid, i);
      batch.set(db.collection('customers').doc(customer.id), customer);
    }
    await batch.commit();
    console.log(`  ✓ seeded ${account.customerCount} customers`);
  }
}

/** Entry point. */
async function main(): Promise<void> {
  initAdmin();
  console.log('Seeding TDC demo accounts…\n');
  for (const account of DEMO_ACCOUNTS) {
    console.log(`▸ ${account.email} (${account.role})`);
    await seedAccount(account);
  }
  console.log('\n✅ Done. Demo accounts are ready to use.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Seeding failed:', err);
    process.exit(1);
  });
