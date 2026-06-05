/**
 * Shared enumerations for the TDC domain model.
 * Kept in one file so every data model imports from a single source of truth.
 */

/** Compatibility tier assigned to a generated match. */
export enum MatchTier {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

/** Lifecycle status of a customer (client) within the matchmaking pipeline. */
export enum CustomerStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  MATCHED = 'MATCHED',
  ON_HOLD = 'ON_HOLD',
  CLOSED = 'CLOSED',
}

/** Gender of a customer. Drives the gender-specific matching rules. */
export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

/** Workflow status of an individual match suggestion. */
export enum MatchStatus {
  SUGGESTED = 'SUGGESTED',
  SENT = 'SENT',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  PASSED = 'PASSED',
}

/** Role of a matchmaker within the organisation. */
export enum MatchmakerRole {
  ADMIN = 'ADMIN',
  MATCHMAKER = 'MATCHMAKER',
}

/** Dietary preference (biodata). */
export enum Diet {
  VEG = 'VEG',
  NON_VEG = 'NON_VEG',
  EGGETARIAN = 'EGGETARIAN',
  JAIN = 'JAIN',
}

/** Yes / No / Occasionally tri-state used for smoking & drinking habits. */
export enum Habit {
  YES = 'YES',
  NO = 'NO',
  OCCASIONALLY = 'OCCASIONALLY',
}

/** Manglik (astrological) status. */
export enum ManglikStatus {
  YES = 'YES',
  NO = 'NO',
  PARTIAL = 'PARTIAL',
}

/** Marital history. */
export enum MaritalStatus {
  NEVER_MARRIED = 'NEVER_MARRIED',
  DIVORCED = 'DIVORCED',
  WIDOWED = 'WIDOWED',
  AWAITING_DIVORCE = 'AWAITING_DIVORCE',
}

/** Family structure. */
export enum FamilyType {
  NUCLEAR = 'NUCLEAR',
  JOINT = 'JOINT',
}

/** Family value orientation. */
export enum FamilyValues {
  ORTHODOX = 'ORTHODOX',
  TRADITIONAL = 'TRADITIONAL',
  MODERATE = 'MODERATE',
  LIBERAL = 'LIBERAL',
}

/** Stance on having children. */
export enum ViewsOnChildren {
  WANTS = 'WANTS',
  DOES_NOT_WANT = 'DOES_NOT_WANT',
  OPEN = 'OPEN',
}

/** Human-readable labels for each enum, used in badges, filters, and AI prompts. */
export const ENUM_LABELS = {
  MatchTier: {
    [MatchTier.HIGH]: 'High',
    [MatchTier.MEDIUM]: 'Medium',
    [MatchTier.LOW]: 'Low',
  },
  CustomerStatus: {
    [CustomerStatus.ACTIVE]: 'Active',
    [CustomerStatus.PENDING]: 'Pending',
    [CustomerStatus.MATCHED]: 'Matched',
    [CustomerStatus.ON_HOLD]: 'On Hold',
    [CustomerStatus.CLOSED]: 'Closed',
  },
  Gender: {
    [Gender.MALE]: 'Male',
    [Gender.FEMALE]: 'Female',
    [Gender.OTHER]: 'Other',
  },
  MatchStatus: {
    [MatchStatus.SUGGESTED]: 'Suggested',
    [MatchStatus.SENT]: 'Sent',
    [MatchStatus.ACCEPTED]: 'Accepted',
    [MatchStatus.REJECTED]: 'Rejected',
    [MatchStatus.PASSED]: 'Passed',
  },
} as const;
