import type { MatchmakerRole } from './enums';

/**
 * A TDC staff member who manages clients and curates matches.
 * Maps to the Firestore `matchmakers` collection / Supabase `matchmakers` table.
 * The `id` equals the Firebase Auth UID.
 */
export interface Matchmaker {
  id: string;
  fullName: string;
  email: string;
  role: MatchmakerRole;
  avatarUrl?: string;
  createdAt: string;
}
