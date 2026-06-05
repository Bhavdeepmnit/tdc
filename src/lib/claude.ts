import type { CustomerProfile } from '@types';
import type { ScoredMatch, ScoreDimension } from '@lib/matching';
import { getAge } from '@utils/date';
import { formatIndianIncome } from '@utils/format';

/**
 * Client-side AI integration for the matchmaking dashboard.
 *
 * All calls go through the serverless proxy (`VITE_CLAUDE_PROXY_URL`, default
 * `/api/claude`) which holds the AI key server-side. The proxy speaks a
 * provider-neutral { messages, systemPrompt } → { text } contract, so this file
 * doesn't care that Gemini sits behind it.
 *
 * Every public function degrades gracefully: if the AI is unavailable, callers
 * receive deterministic content derived from the rules-engine breakdown rather
 * than a thrown error. Raw errors are never surfaced to the end user.
 */

const PROXY_URL = (import.meta.env.VITE_CLAUDE_PROXY_URL as string | undefined) ?? '/api/claude';

/* ════════════════════════════════════════════════════════════════════
 *  PART B — low-level client
 * ════════════════════════════════════════════════════════════════════ */

/**
 * Send a single-turn prompt through the proxy and return the model's text.
 * @throws Error with a user-safe message if the proxy is unreachable or errors.
 */
export async function callClaude(
  systemPrompt: string,
  userMessage: string,
  signal?: AbortSignal,
): Promise<string> {
  let res: Response;
  try {
    res = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
      signal,
    });
  } catch {
    throw new Error('AI service is unreachable.');
  }

  if (!res.ok) {
    let message = `AI request failed (${res.status}).`;
    try {
      const data = (await res.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      /* keep the generic message */
    }
    throw new Error(message);
  }

  const data = (await res.json()) as { text?: string };
  if (!data.text) throw new Error('AI returned an empty response.');
  return data.text;
}

/* ════════════════════════════════════════════════════════════════════
 *  Shared helpers
 * ════════════════════════════════════════════════════════════════════ */

const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));

/** Tolerant JSON extraction — strips ```json fences / prose around the object. */
function extractJson<T>(raw: string): T {
  const fenced = raw.replace(/```(?:json)?/gi, '').trim();
  const start = fenced.indexOf('{');
  const end = fenced.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) {
    throw new Error('No JSON object found in AI response.');
  }
  return JSON.parse(fenced.slice(start, end + 1)) as T;
}

/** Compact biodata line for prompt context. */
function profileSummary(c: CustomerProfile): string {
  return [
    `Name: ${c.firstName} ${c.lastName}`,
    `Age: ${getAge(c.dateOfBirth)}`,
    `Gender: ${c.gender}`,
    `City: ${c.city}`,
    `Religion/Caste: ${c.religion}${c.caste ? `, ${c.caste}` : ''}${c.manglik ? ' (Manglik)' : ''}`,
    `Education: ${c.degree} (${c.undergraduateCollege})`,
    `Work: ${c.designation} at ${c.currentCompany}, ${formatIndianIncome(c.incomeAnnual)}`,
    `Marital status: ${c.maritalStatus.replace(/_/g, ' ')}`,
    `Diet/Smoke/Drink: ${c.diet} / ${c.smoke} / ${c.drink}`,
    `Family: ${c.familyType}, ${c.familyValues} values`,
    `Wants kids: ${c.wantKids}; Open to relocate: ${c.openToRelocate}`,
    `Languages: ${c.languagesKnown.join(', ')}`,
    `Hobbies: ${c.hobbies.join(', ')}`,
    `About: ${c.aboutMe}`,
  ].join('\n');
}

/** Render the rules-engine breakdown as readable lines for prompt grounding. */
function breakdownSummary(dims: ScoreDimension[]): string {
  return dims
    .map((d) => `- ${d.label}: ${d.score}/${d.maxScore} — ${d.reason}`)
    .join('\n');
}

/* ════════════════════════════════════════════════════════════════════
 *  PART C — AI match scorer
 * ════════════════════════════════════════════════════════════════════ */

export interface AIMatchResult {
  /** AI's own 0–100 compatibility score. */
  aiScore: number;
  /** Short qualitative label, e.g. "Strong Match". */
  compatibilityLabel: string;
  strengthsText: string;
  cautionsText: string;
  dealbreakersText: string;
  /** Blended score: algorithm 60% + AI 40%, rounded. */
  combinedScore: number;
  /** True when the AI was unavailable and this result is derived from the algo breakdown. */
  isFallback: boolean;
}

const SCORER_SYSTEM_PROMPT =
  'You are an expert Indian matrimonial matchmaker with 20 years experience. ' +
  'Evaluate this match objectively. Focus on long-term compatibility. Format output as JSON only.';

/** Map a 0–100 score to a qualitative label (used for AI output + fallback). */
function labelForScore(score: number): string {
  if (score >= 85) return 'Excellent Match';
  if (score >= 70) return 'Strong Match';
  if (score >= 55) return 'Promising Match';
  if (score >= 40) return 'Moderate Match';
  return 'Challenging Match';
}

/** Combine algorithm + AI scores using the 60/40 weighting. */
function combine(algoScore: number, aiScore: number): number {
  return Math.round(clamp(algoScore) * 0.6 + clamp(aiScore) * 0.4);
}

/**
 * Ask the AI to evaluate a scored match. Falls back to a deterministic summary
 * built from the rules-engine breakdown if the AI is unavailable.
 *
 * @param customer  - the client the match is for
 * @param match     - the scored candidate (profile + breakdown + flags)
 * @param algoScore - the rules-engine score (0–100); weighted 60% in the blend
 */
export async function aiScoreMatch(
  customer: CustomerProfile,
  match: ScoredMatch,
  algoScore: number,
): Promise<AIMatchResult> {
  const dims = Object.values(match.breakdown);
  const userMessage = [
    'Evaluate the long-term compatibility of this arranged-match pairing.',
    '',
    '=== CLIENT ===',
    profileSummary(customer),
    '',
    '=== CANDIDATE ===',
    profileSummary(match.profile),
    '',
    `=== RULES-ENGINE ANALYSIS (algorithmic score: ${algoScore}/100) ===`,
    breakdownSummary(dims),
    match.flags.length ? `\nFlags:\n${match.flags.map((f) => `- [${f.type}] ${f.message}`).join('\n')}` : '',
    '',
    'Respond with ONLY a JSON object of this exact shape:',
    '{',
    '  "aiScore": <integer 0-100>,',
    '  "compatibilityLabel": "<2-3 word label>",',
    '  "strengthsText": "<2-3 sentences on what makes this work>",',
    '  "cautionsText": "<1-2 sentences on areas to watch>",',
    '  "dealbreakersText": "<hard incompatibilities, or \'None identified\'>"',
    '}',
  ].join('\n');

  try {
    const raw = await callClaude(SCORER_SYSTEM_PROMPT, userMessage);
    const parsed = extractJson<Partial<AIMatchResult>>(raw);
    const aiScore = clamp(Math.round(Number(parsed.aiScore)));
    if (!Number.isFinite(aiScore)) throw new Error('AI score missing.');
    return {
      aiScore,
      compatibilityLabel: parsed.compatibilityLabel?.trim() || labelForScore(aiScore),
      strengthsText: parsed.strengthsText?.trim() || fallbackStrengths(dims),
      cautionsText: parsed.cautionsText?.trim() || fallbackCautions(match),
      dealbreakersText: parsed.dealbreakersText?.trim() || fallbackDealbreakers(match),
      combinedScore: combine(algoScore, aiScore),
      isFallback: false,
    };
  } catch {
    // ── Deterministic fallback from the algo breakdown ──
    return {
      aiScore: algoScore,
      compatibilityLabel: labelForScore(algoScore),
      strengthsText: fallbackStrengths(dims),
      cautionsText: fallbackCautions(match),
      dealbreakersText: fallbackDealbreakers(match),
      combinedScore: algoScore, // no AI signal ⇒ blend collapses to the algo score
      isFallback: true,
    };
  }
}

/** Top-scoring dimensions phrased as strengths. */
function fallbackStrengths(dims: ScoreDimension[]): string {
  const strong = [...dims]
    .filter((d) => d.maxScore > 0 && d.score / d.maxScore >= 0.66)
    .sort((a, b) => b.score / b.maxScore - a.score / a.maxScore)
    .slice(0, 3);
  if (strong.length === 0) return 'No standout strengths from the compatibility breakdown.';
  return `Strong alignment on ${strong.map((d) => `${d.label.toLowerCase()} (${d.reason})`).join('; ')}.`;
}

/** Weak dimensions + CAUTION flags phrased as cautions. */
function fallbackCautions(match: ScoredMatch): string {
  const weak = Object.values(match.breakdown)
    .filter((d) => d.maxScore > 0 && d.score / d.maxScore < 0.5)
    .map((d) => `${d.label.toLowerCase()} (${d.reason})`);
  const cautionFlags = match.flags.filter((f) => f.type === 'CAUTION').map((f) => f.message);
  const all = [...weak, ...cautionFlags];
  return all.length ? `Watch areas: ${all.join('; ')}.` : 'No significant concerns flagged.';
}

/** DEALBREAKER flags, or an all-clear. */
function fallbackDealbreakers(match: ScoredMatch): string {
  const dealbreakers = match.flags.filter((f) => f.type === 'DEALBREAKER').map((f) => f.message);
  return dealbreakers.length ? dealbreakers.join('; ') : 'None identified.';
}

/* ════════════════════════════════════════════════════════════════════
 *  PART D — intro email generator
 * ════════════════════════════════════════════════════════════════════ */

export interface IntroEmail {
  subject: string;
  /** 3–4 paragraph email body. */
  body: string;
  /** Condensed version for WhatsApp. */
  whatsappVersion: string;
  /** True when generated from a local template (AI unavailable). */
  isFallback: boolean;
}

const INTRO_SYSTEM_PROMPT =
  'You are a warm, professional matchmaker at The Date Crew (TDC). ' +
  'Write a personalized introduction email. Tone: warm, respectful, culturally aware. ' +
  'Mention specific compatibility points. Do not mention scores or algorithms. ' +
  'Format as JSON: { subject, body, whatsappVersion }';

/**
 * Generate a personalised introduction email for a match. Falls back to a
 * deterministic template if the AI is unavailable.
 *
 * @param customer - the client receiving the introduction
 * @param match    - the scored candidate being introduced
 * @param _score   - compatibility score; intentionally NOT used in the copy
 *                   (the brief forbids mentioning scores), kept for API symmetry
 *                   with `aiScoreMatch` and future tone-tuning.
 */
export async function generateMatchIntro(
  customer: CustomerProfile,
  match: ScoredMatch,
  _score: number,
): Promise<IntroEmail> {
  const candidate = match.profile;
  const highlights = Object.values(match.breakdown)
    .filter((d) => d.maxScore > 0 && d.score / d.maxScore >= 0.6)
    .map((d) => d.reason);

  const userMessage = [
    `Write an introduction email to ${customer.firstName} introducing a potential match.`,
    '(Internal compatibility context — do NOT mention any numbers or scoring in the email.)',
    '',
    '=== CLIENT (recipient) ===',
    profileSummary(customer),
    '',
    '=== SUGGESTED MATCH ===',
    profileSummary(candidate),
    '',
    `Key compatibility points to weave in naturally: ${highlights.join('; ') || 'shared values and lifestyle'}.`,
    '',
    'Return ONLY JSON: { "subject": string, "body": string (3-4 warm paragraphs), "whatsappVersion": string (short, friendly) }.',
  ].join('\n');

  try {
    const raw = await callClaude(INTRO_SYSTEM_PROMPT, userMessage);
    const parsed = extractJson<Partial<IntroEmail>>(raw);
    if (!parsed.subject || !parsed.body) throw new Error('Incomplete email payload.');
    return {
      subject: parsed.subject.trim(),
      body: parsed.body.trim(),
      whatsappVersion: parsed.whatsappVersion?.trim() || fallbackWhatsapp(customer, candidate),
      isFallback: false,
    };
  } catch {
    return fallbackEmail(customer, candidate, highlights);
  }
}

/** Deterministic email template used when the AI is unavailable. */
function fallbackEmail(
  customer: CustomerProfile,
  candidate: CustomerProfile,
  highlights: string[],
): IntroEmail {
  const candidateName = `${candidate.firstName} ${candidate.lastName}`;
  const points = highlights.length
    ? highlights.slice(0, 3).join(', ')
    : 'shared values, lifestyle, and family background';
  const body = [
    `Dear ${customer.firstName},`,
    '',
    `I hope this note finds you well. I'm delighted to introduce a profile I believe is genuinely worth your consideration — ${candidateName}, a ${getAge(candidate.dateOfBirth)}-year-old ${candidate.designation} based in ${candidate.city}.`,
    '',
    `What stood out to me is the natural alignment between the two of you, particularly around ${points}. Coming from a ${candidate.familyValues}, ${candidate.familyType} family, ${candidate.firstName} shares many of the priorities you've spoken about.`,
    '',
    `If this feels like someone you'd like to know more about, just reply and I'll be happy to arrange a conversation at your convenience.`,
    '',
    'Warm regards,\nThe Date Crew',
  ].join('\n');

  return {
    subject: `A thoughtful introduction for you, ${customer.firstName}`,
    body,
    whatsappVersion: fallbackWhatsapp(customer, candidate),
    isFallback: true,
  };
}

function fallbackWhatsapp(customer: CustomerProfile, candidate: CustomerProfile): string {
  return (
    `Hi ${customer.firstName}! 🌸 We've found a lovely match for you — ${candidate.firstName}, ` +
    `a ${getAge(candidate.dateOfBirth)}-yr-old ${candidate.designation} in ${candidate.city}. ` +
    `Shall I share the full profile? — The Date Crew`
  );
}
