/**
 * An entry in the matchmaker's activity feed (match sent, match passed, status
 * change). Lightweight + denormalised (stores display names) so the feed renders
 * without extra look-ups. Persisted to the `activities` collection in live mode.
 */
export type ActivityType = 'MATCH_SENT' | 'MATCH_REJECTED' | 'STATUS_CHANGED';

export interface Activity {
  id: string;
  type: ActivityType;
  /** FK → CustomerProfile.id this activity concerns (the client). */
  customerId: string;
  /** Client display name, denormalised for rendering. */
  customerName: string;
  /** Candidate/target display name, where applicable. */
  targetName?: string;
  /** Short human-readable summary, e.g. "Match sent to Aarav Mehta". */
  message: string;
  createdAt: string;
}
