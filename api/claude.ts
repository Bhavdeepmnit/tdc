/**
 * Serverless AI proxy (Vercel edge function), backed by Google Gemini.
 *
 * WHY: the AI key must never ship in the Vite client bundle. The browser calls
 * THIS endpoint with { messages, systemPrompt }; the function injects the secret
 * `GEMINI_API_KEY` (host env, not bundled) and forwards to the Generative
 * Language API. The route stays `/api/claude` so the client contract is stable
 * regardless of which model sits behind it.
 *
 * Contract:
 *   POST /api/claude
 *   body: { messages: {role:'user'|'assistant', content:string}[], systemPrompt?: string, maxTokens?: number }
 *   200:  { text: string }
 *   4xx/5xx: { error: string }
 *
 * Hardening:
 *   • Rate limit: 10 requests / minute / IP (best-effort, in-memory sliding window).
 *   • Errors mapped to 400 / 429 / 502 / 504; upstream 429 is propagated as 429.
 *   • Upstream call is bounded by a 30s timeout (AbortController) → 504.
 *
 * Env: GEMINI_API_KEY (required), GEMINI_MODEL (optional, default gemini-2.0-flash).
 */

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ProxyRequestBody {
  messages: ChatMessage[];
  systemPrompt?: string;
  maxTokens?: number;
}

interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
}

export const config = { runtime: 'edge' };

// ── Rate limiting (best-effort) ───────────────────────────────────────────
// Module scope persists only per warm edge instance, so this is a soft guard,
// not a hard global limit. For a strict cross-instance limit, back it with a
// shared store (Vercel KV / Upstash Redis) keyed the same way.
const RATE_LIMIT = 10;
const WINDOW_MS = 60_000;
const hits = new Map<string, number[]>();

function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]!.trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

/** Returns remaining-allowance info; `limited` is true once the window is full. */
function rateLimit(ip: string): { limited: boolean; retryAfter: number } {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    const retryAfter = Math.ceil((WINDOW_MS - (now - recent[0]!)) / 1000);
    hits.set(ip, recent);
    return { limited: true, retryAfter: Math.max(retryAfter, 1) };
  }
  recent.push(now);
  hits.set(ip, recent);
  return { limited: false, retryAfter: 0 };
}

const TIMEOUT_MS = 30_000;

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return json({ error: 'Server misconfigured: GEMINI_API_KEY missing.' }, 500);
  }

  // ── Rate limit ──
  const { limited, retryAfter } = rateLimit(clientIp(req));
  if (limited) {
    return json({ error: 'Rate limit exceeded. Please slow down.' }, 429, {
      'retry-after': String(retryAfter),
    });
  }

  // ── Parse + validate ──
  let body: ProxyRequestBody;
  try {
    body = (await req.json()) as ProxyRequestBody;
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400);
  }
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return json({ error: 'Missing `messages`.' }, 400);
  }

  const model = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  // Map our role names to Gemini's ('assistant' → 'model').
  const contents = body.messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const payload: Record<string, unknown> = {
    contents,
    generationConfig: { maxOutputTokens: body.maxTokens ?? 1500, temperature: 0.7 },
  };
  if (body.systemPrompt) {
    payload.systemInstruction = { parts: [{ text: body.systemPrompt }] };
  }

  // ── Upstream call with timeout ──
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
  } catch (err) {
    const aborted = err instanceof Error && err.name === 'AbortError';
    return json(
      { error: aborted ? 'Upstream timed out.' : 'Failed to reach AI service.' },
      aborted ? 504 : 502,
    );
  } finally {
    clearTimeout(timer);
  }

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => '');
    // Propagate throttling so the client can back off; collapse the rest to 502.
    const status = upstream.status === 429 ? 429 : 502;
    return json({ error: `AI service error (${upstream.status}): ${detail.slice(0, 300)}` }, status);
  }

  const data = (await upstream.json()) as GeminiResponse;
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
  if (!text) {
    return json({ error: 'AI service returned an empty response.' }, 502);
  }

  return json({ text }, 200);
}

/** JSON response helper. */
function json(payload: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}
