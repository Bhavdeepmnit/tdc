import type { CustomerStatus } from './enums';

/**
 * FLAT biodata profile — the data-layer shape used by the seed script, the
 * `customers.ts` dataset, the data hooks, and the filter utility.
 *
 * ⚠️ This is INTENTIONALLY DIFFERENT from the nested `Customer` type in
 * `Customer.ts`. It was generated to a flat spec (firstName/lastName, city,
 * string-literal unions, ~20 extra biodata fields). The legacy nested
 * `Customer` (community.religion, career.profession, …) still backs
 * `mockCustomers.ts` and the Claude proxy prompt. If/when the app migrates to
 * this flat model, those consumers need updating. See `CustomerStatus` reuse
 * below — that one enum is shared so pipeline status stays consistent.
 */

export type Gender = 'male' | 'female';

export type MaritalStatus = 'never_married' | 'divorced' | 'widowed' | 'separated';

export type Diet = 'vegetarian' | 'non-vegetarian' | 'eggetarian' | 'vegan';

export type SmokeHabit = 'never' | 'occasionally' | 'regularly';

export type DrinkHabit = 'never' | 'occasionally' | 'socially' | 'regularly';

/** Tri-state preference used for kids / relocation / pets. */
export type TriState = 'yes' | 'no' | 'maybe';

export type FamilyType = 'nuclear' | 'joint';

export type FamilyValues = 'orthodox' | 'traditional' | 'moderate' | 'liberal';

export type Complexion = 'fair' | 'wheatish' | 'wheatish-medium' | 'dusky' | 'dark';

export type BodyType = 'slim' | 'average' | 'athletic' | 'heavy';

export type PhysicalStatus = 'normal' | 'differently-abled';

/**
 * A single matchmaking-CRM biodata record. One object per row in `customers.ts`.
 */
export interface CustomerProfile {
  id: string;

  // ── Identity ──
  firstName: string;
  lastName: string;
  gender: Gender;
  /** ISO 8601 date (YYYY-MM-DD). Age is derived. */
  dateOfBirth: string;
  country: string;
  city: string;
  /** Height in centimetres. */
  height: number;

  // ── Contact ──
  email: string;
  phone: string;

  // ── Education & career ──
  undergraduateCollege: string;
  degree: string;
  /** Gross annual income in INR (rupees, not lakhs). */
  incomeAnnual: number;
  currentCompany: string;
  designation: string;

  // ── Relationship / family-formation intent ──
  maritalStatus: MaritalStatus;
  wantKids: TriState;
  openToRelocate: TriState;
  openToPets: TriState;

  // ── Community ──
  religion: string;
  caste: string;
  subCaste?: string;
  /** Present for Hindu profiles only. */
  gotra?: string;
  manglik: boolean;
  languagesKnown: string[];
  siblings: number;

  // ── Lifestyle ──
  diet: Diet;
  smoke: SmokeHabit;
  drink: DrinkHabit;

  // ── Appearance ──
  physicalStatus: PhysicalStatus;
  complexion: Complexion;
  bodyType: BodyType;

  // ── Family ──
  familyType: FamilyType;
  familyValues: FamilyValues;
  fatherOccupation: string;
  motherOccupation: string;

  // ── Personality ──
  hobbies: string[];
  aboutMe: string;

  // ── Media & pipeline ──
  /** DiceBear personas avatar, seeded by firstName. */
  profilePhoto: string;
  createdAt: string;
  status: CustomerStatus;
  /** FK → Matchmaker.id (e.g. "mm_001"), or null when in the unassigned pool. */
  assignedMatchmakerId: string | null;
}
