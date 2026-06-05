/**
 * A free-text note a matchmaker records against a customer.
 * Maps to the Firestore `notes` collection / Supabase `notes` table.
 */
export interface Note {
  id: string;
  /** FK → Customer.id this note belongs to. */
  customerId: string;
  /** FK → Matchmaker.id who authored the note. */
  matchmakerId: string;
  content: string;
  createdAt: string;
}

/** Payload for creating a new note (id/createdAt assigned by the backend). */
export type NewNote = Omit<Note, 'id' | 'createdAt'>;
