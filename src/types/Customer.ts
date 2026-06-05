import type {
  CustomerStatus,
  Diet,
  FamilyType,
  FamilyValues,
  Gender,
  Habit,
  ManglikStatus,
  MaritalStatus,
  ViewsOnChildren,
} from './enums';

/**
 * Religion & community sub-section of a customer's biodata.
 * Heavily used by the female-client matching rules (strict religion/caste filters).
 */
export interface CommunityInfo {
  religion: string; // Hindu, Muslim, Sikh, Jain, Christian, ...
  caste?: string;
  subCaste?: string;
  gotra?: string;
  motherTongue: string;
}

/** Lifestyle habits sub-section. */
export interface LifestyleInfo {
  diet: Diet;
  smoking: Habit;
  drinking: Habit;
}

/** Education & career sub-section. */
export interface CareerInfo {
  education: string; // e.g. "MBA", "B.Tech"
  profession: string;
  /** Free-text bracket, e.g. "10-15 LPA". `incomeLPA` is the numeric form for matching. */
  incomeBracket: string;
  /** Normalised annual income in lakhs-per-annum, used by the ranking algorithm. */
  incomeLPA: number;
}

/** Location sub-section. */
export interface LocationInfo {
  currentCity: string;
  relocationWillingness: boolean;
}

/** Family & values sub-section. */
export interface FamilyInfo {
  familyType: FamilyType;
  familyValues: FamilyValues;
}

/** Relationship history & intentions sub-section. */
export interface RelationshipInfo {
  maritalStatus: MaritalStatus;
  /** "No" | "Yes-Living together" | "Yes-Not living together" */
  hasChildren: 'NO' | 'YES_LIVING_TOGETHER' | 'YES_NOT_LIVING_TOGETHER';
  viewsOnChildren: ViewsOnChildren;
}

/**
 * A customer (client) of TDC — the central biodata record.
 * Maps to the Firestore `customers` collection / Supabase `customers` table.
 */
export interface Customer {
  id: string;
  /** FK → Matchmaker.id. The owner who manages this client. */
  matchmakerId: string;

  // ── Core identity ──
  fullName: string;
  gender: Gender;
  /** ISO 8601 date string (YYYY-MM-DD). Age is derived, see `getAge()`. */
  dateOfBirth: string;
  heightCm: number;
  avatarUrl?: string;

  // ── Biodata sub-sections ──
  community: CommunityInfo;
  manglikStatus: ManglikStatus;
  lifestyle: LifestyleInfo;
  career: CareerInfo;
  location: LocationInfo;
  family: FamilyInfo;
  relationship: RelationshipInfo;

  // ── Pipeline state ──
  status: CustomerStatus;
  /** Whether the client is actively being matched. Mirrors !CLOSED && !ON_HOLD. */
  isActive: boolean;

  /** ISO timestamps. */
  createdAt: string;
  updatedAt: string;
}

/** Lightweight projection used in dashboard lists / profile cards. */
export interface CustomerSummary {
  id: string;
  fullName: string;
  gender: Gender;
  age: number;
  currentCity: string;
  profession: string;
  avatarUrl?: string;
  status: CustomerStatus;
}
