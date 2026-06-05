import type { MatchStatus, MatchTier } from './enums';
import type { CustomerSummary } from './Customer';

/**
 * A single dimension contributing to the overall compatibility score.
 * Surfaced in the UI to explain *why* a score is what it is.
 */
export interface MatchFactor {
  /** e.g. "Age", "Income", "Religion", "Relocation". */
  label: string;
  /** Points this factor contributed (0–100, weighted). */
  score: number;
  /** Short human explanation, e.g. "3 years younger — within preference." */
  detail: string;
  /** Whether this factor passed the hard filter / soft preference. */
  passed: boolean;
}

/**
 * A potential match between a client and a candidate from the opposite-gender pool.
 * Maps to the Firestore `matches` collection / Supabase `matches` table.
 */
export interface Match {
  id: string;
  /** FK → Customer.id (the client this match is *for*). */
  clientId: string;
  /** FK → Customer.id (the suggested candidate). */
  matchedProfileId: string;

  /** Overall compatibility score, 0–100. */
  score: number;
  tier: MatchTier;
  /** Breakdown that produced `score`. */
  factors: MatchFactor[];

  // ── AI-generated content (filled lazily via the Claude proxy) ──
  aiExplanation?: string;
  aiDraftIntro?: string;

  status: MatchStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * A match hydrated with the candidate's summary, ready for rendering in MatchCard.
 * Produced by the matching engine / data layer; not persisted as-is.
 */
export interface MatchWithProfile extends Match {
  profile: CustomerSummary;
}
