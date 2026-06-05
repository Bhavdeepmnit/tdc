import type { CustomerProfile } from '@types';
import { CustomerStatus } from '@types';
import { getAge } from '@utils/date';

/* ════════════════════════════════════════════════════════════════════
 *  Types — exported for use by UI components (MatchCard, ScorePanel)
 * ════════════════════════════════════════════════════════════════════ */

/** A single scoring dimension with its points, max, and a human explanation. */
export interface ScoreDimension {
  /** Dimension name, e.g. "Religion", "Children". */
  label: string;
  /** Points awarded for this dimension. */
  score: number;
  /** Maximum possible points for this dimension. */
  maxScore: number;
  /** Human-readable reason, e.g. "Same religion — Hindu". */
  reason: string;
}

/** Full breakdown of how the final score was computed. Keyed by dimension slug. */
export type ScoreBreakdown = Record<string, ScoreDimension>;

/** A flag surfaced to the matchmaker: red-banner deal-breaker, gold-star highlight, or amber caution. */
export interface MatchFlag {
  type: 'DEALBREAKER' | 'HIGHLIGHT' | 'CAUTION';
  message: string;
}

/** Tier label derived from the final score. */
export type MatchTierLabel = 'HIGH' | 'MEDIUM' | 'LOW';

/** Score result for one candidate. */
export interface MatchScore {
  /** Final compatibility score, 0–100. */
  score: number;
  /** Tier derived from score: HIGH (≥75), MEDIUM (≥50), LOW (<50). */
  tier: MatchTierLabel;
  /** Per-dimension scoring breakdown. */
  breakdown: ScoreBreakdown;
  /** Actionable flags (deal-breakers, highlights, cautions). */
  flags: MatchFlag[];
}

/** A scored match bundling the candidate profile with scores. */
export interface ScoredMatch extends MatchScore {
  /** The candidate profile that was scored. */
  profile: CustomerProfile;
}

/* ════════════════════════════════════════════════════════════════════
 *  Helpers — pure, no side-effects
 * ════════════════════════════════════════════════════════════════════ */

/** Clamp a number to [min, max]. */
const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));

/** Case-insensitive string match. */
const eq = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** Convert score → tier. */
function toTier(score: number): MatchTierLabel {
  if (score >= 75) return 'HIGH';
  if (score >= 50) return 'MEDIUM';
  return 'LOW';
}

/**
 * Broad religion grouping used for "same group" partial matches.
 * e.g. Hindu & Jain are in the "dharmic" group, Muslim & Islam are "abrahamic".
 */
function religionGroup(religion: string): string {
  const r = religion.toLowerCase();
  if (['hindu', 'jain', 'buddhist', 'sikh'].some((g) => r.includes(g))) return 'dharmic';
  if (['muslim', 'islam'].some((g) => r.includes(g))) return 'abrahamic';
  if (['christian', 'catholic', 'protestant'].some((g) => r.includes(g))) return 'christian';
  return 'other';
}

/**
 * Diet strictness ladder: vegan(4) > vegetarian(3) > eggetarian(2) > non-veg(1).
 * Two people are "diet compatible" if they're within 1 step.
 */
function dietScore(diet: string): number {
  switch (diet) {
    case 'vegan': return 4;
    case 'vegetarian': return 3;
    case 'eggetarian': return 2;
    default: return 1;
  }
}

/** Habit severity: never(0), occasionally/socially(1), regularly(2). */
function habitSeverity(habit: string): number {
  if (habit === 'never') return 0;
  if (habit === 'regularly') return 2;
  return 1; // occasionally, socially
}

/**
 * Simple education-level mapping for comparison.
 * Higher number = "higher" education tier.
 */
function eduLevel(degree: string): number {
  const d = degree.toLowerCase();
  if (d.includes('phd') || d.includes('doctorate')) return 5;
  if (d.includes('m.tech') || d.includes('mba') || d.includes('m.sc') || d.includes('md') || d.includes('m.arch') || d.includes('llm')) return 4;
  if (d.includes('ca') || d.includes('cs') || d.includes('cfa')) return 4;
  if (d.includes('b.tech') || d.includes('b.e') || d.includes('mbbs') || d.includes('b.des') || d.includes('llb')) return 3;
  if (d.includes('b.com') || d.includes('b.sc') || d.includes('b.a') || d.includes('bba')) return 2;
  if (d.includes('diploma') || d.includes('12th') || d.includes('hsc')) return 1;
  return 2; // default to undergraduate
}

/** Count overlapping items (case-insensitive) between two string arrays. */
function overlap(a: string[], b: string[]): number {
  const setB = new Set(b.map((s) => s.toLowerCase()));
  return a.filter((s) => setB.has(s.toLowerCase())).length;
}

/* ════════════════════════════════════════════════════════════════════
 *  Hard Filters (Male clients only)
 * ════════════════════════════════════════════════════════════════════ */

/**
 * For MALE clients: candidate must pass ALL of these or be eliminated.
 * Returns `null` if candidate passes, or a reason string if eliminated.
 */
function maleHardFilter(client: CustomerProfile, candidate: CustomerProfile): string | null {
  if (candidate.gender !== 'female') return 'Not female';

  const clientAge = getAge(client.dateOfBirth);
  const candidateAge = getAge(candidate.dateOfBirth);
  if (candidateAge >= clientAge) return `Candidate (${candidateAge}) not younger than client (${clientAge})`;

  if (candidate.height > client.height) return `Candidate (${candidate.height}cm) taller than client (${client.height}cm)`;

  if (candidate.incomeAnnual > client.incomeAnnual * 0.9) {
    return `Candidate income exceeds 90% of client income`;
  }

  return null; // passes
}

/* ════════════════════════════════════════════════════════════════════
 *  Soft Scoring — Male Client (100 pts)
 * ════════════════════════════════════════════════════════════════════ */

function scoreForMaleClient(client: CustomerProfile, candidate: CustomerProfile): ScoreBreakdown {
  const bd: ScoreBreakdown = {};
  const clientAge = getAge(client.dateOfBirth);
  const candidateAge = getAge(candidate.dateOfBirth);
  const ageDiff = Math.abs(clientAge - candidateAge);

  // ── Children Compatibility (25 pts) ──
  {
    let score = 5;
    let reason = 'Mismatched views on children';
    if (client.wantKids === candidate.wantKids) {
      if (client.wantKids === 'yes') { score = 25; reason = 'Both want children'; }
      else if (client.wantKids === 'maybe') { score = 20; reason = 'Both open to children'; }
      else { score = 25; reason = 'Neither wants children'; }
    } else if (client.wantKids === 'maybe' || candidate.wantKids === 'maybe') {
      score = 15; reason = 'One is open to children';
    }
    bd.children = { label: 'Children', score, maxScore: 25, reason };
  }

  // ── Religion Match (20 pts) ──
  {
    let score = 5;
    let reason = 'Different religion';
    if (eq(client.religion, candidate.religion)) {
      score = 20; reason = `Same religion — ${client.religion}`;
    } else if (religionGroup(client.religion) === religionGroup(candidate.religion)) {
      score = 10; reason = 'Same religious group';
    }
    bd.religion = { label: 'Religion', score, maxScore: 20, reason };
  }

  // ── City Proximity (15 pts) ──
  {
    let score = 4;
    let reason = 'Different city';
    if (eq(client.city, candidate.city)) {
      score = 15; reason = `Both in ${client.city}`;
    } else if (candidate.openToRelocate === 'yes') {
      score = 12; reason = 'Candidate willing to relocate';
    } else if (candidate.openToRelocate === 'maybe') {
      score = 8; reason = 'Candidate might relocate';
    }
    bd.city = { label: 'City', score, maxScore: 15, reason };
  }

  // ── Education Level (15 pts) ──
  {
    const diff = Math.abs(eduLevel(client.degree) - eduLevel(candidate.degree));
    let score = 4;
    let reason = `Education gap of ${diff} levels`;
    if (diff === 0) { score = 15; reason = 'Similar education level'; }
    else if (diff === 1) { score = 8; reason = 'One level education difference'; }
    bd.education = { label: 'Education', score, maxScore: 15, reason };
  }

  // ── Lifestyle Match (15 pts) — diet (7) + smoke (4) + drink (4) ──
  {
    const dietDiff = Math.abs(dietScore(client.diet) - dietScore(candidate.diet));
    const smokeDiff = Math.abs(habitSeverity(client.smoke) - habitSeverity(candidate.smoke));
    const drinkDiff = Math.abs(habitSeverity(client.drink) - habitSeverity(candidate.drink));

    const dietPts = dietDiff === 0 ? 7 : dietDiff === 1 ? 4 : 1;
    const smokePts = smokeDiff === 0 ? 4 : smokeDiff === 1 ? 2 : 0;
    const drinkPts = drinkDiff === 0 ? 4 : drinkDiff === 1 ? 2 : 0;
    const score = dietPts + smokePts + drinkPts;

    const parts: string[] = [];
    if (dietDiff === 0) parts.push('same diet');
    if (smokeDiff === 0) parts.push('same smoke habit');
    if (drinkDiff === 0) parts.push('same drink habit');
    const reason = parts.length > 0 ? parts.join(', ') : 'Lifestyle differences';

    bd.lifestyle = { label: 'Lifestyle', score, maxScore: 15, reason };
  }

  // ── Age Difference (10 pts) ──
  {
    let score = 1;
    let reason = `${ageDiff} year gap`;
    if (ageDiff >= 1 && ageDiff <= 4) { score = 10; reason = `${ageDiff} year gap — ideal`; }
    else if (ageDiff >= 5 && ageDiff <= 7) { score = 7; reason = `${ageDiff} year gap — acceptable`; }
    else if (ageDiff >= 8 && ageDiff <= 10) { score = 4; reason = `${ageDiff} year gap — moderate`; }
    bd.age = { label: 'Age Gap', score, maxScore: 10, reason };
  }

  return bd;
}

/* ════════════════════════════════════════════════════════════════════
 *  Soft Scoring — Female Client (100 pts, NO hard filters)
 * ════════════════════════════════════════════════════════════════════ */

function scoreForFemaleClient(client: CustomerProfile, candidate: CustomerProfile): ScoreBreakdown {
  const bd: ScoreBreakdown = {};

  // ── Profession Compatibility (20 pts) ──
  {
    const hasJob = candidate.designation.trim().length > 0 && candidate.currentCompany.trim().length > 0;
    const highIncome = candidate.incomeAnnual >= 1_500_000; // ≥15 LPA
    let score = 5;
    let reason = 'No clear profession';
    if (hasJob && highIncome) { score = 20; reason = `${candidate.designation} at ${candidate.currentCompany}`; }
    else if (hasJob) { score = 14; reason = `${candidate.designation} — moderate income`; }
    else if (highIncome) { score = 12; reason = 'High income, profession unclear'; }
    bd.profession = { label: 'Profession', score, maxScore: 20, reason };
  }

  // ── Values Alignment (20 pts) ──
  {
    let score = 5;
    let reason = 'Differing family values';
    if (client.familyValues === candidate.familyValues) {
      score = 20; reason = `Both ${client.familyValues} values`;
    } else {
      // Adjacent values get partial credit (e.g. moderate ↔ liberal)
      const order = ['orthodox', 'traditional', 'moderate', 'liberal'];
      const diff = Math.abs(order.indexOf(client.familyValues) - order.indexOf(candidate.familyValues));
      if (diff === 1) { score = 12; reason = 'Similar family values'; }
    }
    bd.values = { label: 'Values', score, maxScore: 20, reason };
  }

  // ── Relocation Flexibility (15 pts) ──
  {
    let score = 4;
    let reason = 'Not open to relocation';
    if (eq(client.city, candidate.city)) {
      score = 15; reason = `Both in ${client.city}`;
    } else if (candidate.openToRelocate === 'yes') {
      score = 15; reason = 'Candidate willing to relocate';
    } else if (candidate.openToRelocate === 'maybe') {
      score = 10; reason = 'Candidate might relocate';
    }
    bd.relocation = { label: 'Relocation', score, maxScore: 15, reason };
  }

  // ── Religion & Caste (15 pts) ──
  {
    let score = 3;
    let reason = 'Different religion';
    if (eq(client.religion, candidate.religion)) {
      if (eq(client.caste, candidate.caste)) {
        score = 15; reason = `Same religion & caste — ${client.religion}, ${client.caste}`;
      } else {
        score = 10; reason = `Same religion (${client.religion}), different caste`;
      }
    } else if (religionGroup(client.religion) === religionGroup(candidate.religion)) {
      score = 6; reason = 'Same religious group';
    }
    bd.religionCaste = { label: 'Religion & Caste', score, maxScore: 15, reason };
  }

  // ── Lifestyle Compatibility (15 pts) ──
  {
    const dietDiff = Math.abs(dietScore(client.diet) - dietScore(candidate.diet));
    const smokeDiff = Math.abs(habitSeverity(client.smoke) - habitSeverity(candidate.smoke));
    const drinkDiff = Math.abs(habitSeverity(client.drink) - habitSeverity(candidate.drink));

    const dietPts = dietDiff === 0 ? 7 : dietDiff === 1 ? 4 : 1;
    const smokePts = smokeDiff === 0 ? 4 : smokeDiff === 1 ? 2 : 0;
    const drinkPts = drinkDiff === 0 ? 4 : drinkDiff === 1 ? 2 : 0;
    const score = dietPts + smokePts + drinkPts;

    const parts: string[] = [];
    if (dietDiff === 0) parts.push('same diet');
    if (smokeDiff === 0) parts.push('same smoke habit');
    if (drinkDiff === 0) parts.push('same drink habit');
    const reason = parts.length > 0 ? parts.join(', ') : 'Lifestyle differences';

    bd.lifestyle = { label: 'Lifestyle', score, maxScore: 15, reason };
  }

  // ── Children & Family (15 pts) ──
  {
    let score = 3;
    let reason = 'Mismatched views on children';
    if (client.wantKids === candidate.wantKids) {
      score = 15; reason = `Both ${client.wantKids === 'yes' ? 'want' : client.wantKids === 'no' ? "don't want" : 'open to'} children`;
    } else if (client.wantKids === 'maybe' || candidate.wantKids === 'maybe') {
      score = 10; reason = 'One is open to children';
    }
    // Bonus for matching family type
    if (client.familyType === candidate.familyType) {
      score = Math.min(score + 2, 15);
      reason += `, same family type (${client.familyType})`;
    }
    bd.children = { label: 'Children & Family', score, maxScore: 15, reason };
  }

  return bd;
}

/* ════════════════════════════════════════════════════════════════════
 *  Flag Detection
 * ════════════════════════════════════════════════════════════════════ */

function detectFlags(
  client: CustomerProfile,
  candidate: CustomerProfile,
  finalScore: number,
): MatchFlag[] {
  const flags: MatchFlag[] = [];

  // ── DEALBREAKERS ──

  // Strict veg vs non-veg
  const clientVeg = client.diet === 'vegetarian' || client.diet === 'vegan';
  const candidateVeg = candidate.diet === 'vegetarian' || candidate.diet === 'vegan';
  if (clientVeg && !candidateVeg) {
    flags.push({ type: 'DEALBREAKER', message: 'Client is vegetarian, candidate is non-vegetarian' });
  }
  if (!clientVeg && candidateVeg && candidate.diet === 'vegan') {
    flags.push({ type: 'DEALBREAKER', message: 'Candidate is vegan, client is not' });
  }

  // Manglik mismatch (one is manglik, other is not)
  if (client.manglik !== candidate.manglik) {
    flags.push({ type: 'DEALBREAKER', message: `Manglik mismatch — client: ${client.manglik ? 'Yes' : 'No'}, candidate: ${candidate.manglik ? 'Yes' : 'No'}` });
  }

  // Kids hard yes vs hard no
  if (
    (client.wantKids === 'yes' && candidate.wantKids === 'no') ||
    (client.wantKids === 'no' && candidate.wantKids === 'yes')
  ) {
    flags.push({ type: 'DEALBREAKER', message: 'Opposite views on having children' });
  }

  // ── HIGHLIGHTS ──

  // High score + same religion + same city
  if (finalScore > 80 && eq(client.religion, candidate.religion) && eq(client.city, candidate.city)) {
    flags.push({ type: 'HIGHLIGHT', message: 'Excellent match — same religion & city, high compatibility' });
  }

  // 3+ hobby overlap
  const hobbyOverlap = overlap(client.hobbies, candidate.hobbies);
  if (hobbyOverlap >= 3) {
    flags.push({ type: 'HIGHLIGHT', message: `${hobbyOverlap} shared hobbies` });
  }

  // Both prefer to stay in their city (no relocation) and same city
  if (
    client.openToRelocate === 'no' &&
    candidate.openToRelocate === 'no' &&
    eq(client.city, candidate.city)
  ) {
    flags.push({ type: 'HIGHLIGHT', message: `Both settled in ${client.city}` });
  }

  // ── CAUTIONS ──

  // Large age gap (>8 years)
  const ageDiff = Math.abs(getAge(client.dateOfBirth) - getAge(candidate.dateOfBirth));
  if (ageDiff > 8) {
    flags.push({ type: 'CAUTION', message: `Significant age gap of ${ageDiff} years` });
  }

  // Large income disparity (>3x)
  const incomeRatio = Math.max(client.incomeAnnual, candidate.incomeAnnual) /
    Math.max(Math.min(client.incomeAnnual, candidate.incomeAnnual), 1);
  if (incomeRatio > 3) {
    flags.push({ type: 'CAUTION', message: `Large income disparity (${incomeRatio.toFixed(1)}×)` });
  }

  return flags;
}

/* ════════════════════════════════════════════════════════════════════
 *  Main Entry Point — generateMatches()
 * ════════════════════════════════════════════════════════════════════ */

/**
 * Generate ranked compatibility matches for a customer.
 *
 * Pure function — no side effects, no mutations, deterministic for the same inputs.
 *
 * Pipeline:
 *  1. Filter to opposite gender only
 *  2. Exclude CLOSED profiles
 *  3. For male clients: apply hard filters (age, height, income)
 *  4. Score each candidate using gender-specific rules (100 pts)
 *  5. Detect deal-breaker / highlight / caution flags
 *  6. Sort by score descending, return top `limit`
 *
 * @param customer - the client to find matches for
 * @param pool     - all candidate profiles (will be filtered internally)
 * @param limit    - max matches to return (default 20)
 * @returns scored and ranked matches
 */
export function generateMatches(
  customer: CustomerProfile,
  pool: CustomerProfile[],
  limit = 20,
): ScoredMatch[] {
  const targetGender = customer.gender === 'male' ? 'female' : 'male';
  const isMale = customer.gender === 'male';
  const scorer = isMale ? scoreForMaleClient : scoreForFemaleClient;

  const results: ScoredMatch[] = [];

  for (const candidate of pool) {
    // ── Basic exclusions ──
    if (candidate.id === customer.id) continue;
    if (candidate.gender !== targetGender) continue;
    if (candidate.status === CustomerStatus.CLOSED) continue;

    // ── Male hard filters ──
    if (isMale) {
      const rejection = maleHardFilter(customer, candidate);
      if (rejection !== null) continue;
    }

    // ── Soft scoring ──
    const breakdown = scorer(customer, candidate);
    const totalPts = Object.values(breakdown).reduce((sum, d) => sum + d.score, 0);
    const score = clamp(Math.round(totalPts));
    const tier = toTier(score);

    // ── Flags ──
    const flags = detectFlags(customer, candidate, score);

    results.push({ profile: candidate, score, tier, breakdown, flags });
  }

  // Sort by score descending, then by number of deal-breakers ascending (prefer fewer)
  results.sort((a, b) => {
    const aBreakers = a.flags.filter((f) => f.type === 'DEALBREAKER').length;
    const bBreakers = b.flags.filter((f) => f.type === 'DEALBREAKER').length;
    if (a.score !== b.score) return b.score - a.score;
    return aBreakers - bBreakers;
  });

  return results.slice(0, limit);
}

/**
 * Re-export a tier converter that maps our string tiers to the enum,
 * used by components that need the old MatchTier enum.
 */
export { toTier };
