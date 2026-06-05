# TDC Matchmaker Dashboard — Submission

**Live URL:** _<add Vercel URL>_ · **Repo:** _<add GitHub URL>_
**Demo login:** any email (e.g. `matchmaker1@tdc.com`) + any password (mock mode is on).

---

## Write-up

**Tech choices.** The dashboard is a React 18 + TypeScript SPA built with Vite for fast
builds and clean code-splitting, styled with Tailwind CSS against a small design-token
system (crimson/champagne brand, 8-pt spacing scale). State is split between Zustand (a
lightweight client store for the roster, computed matches, and the activity feed) and
Firebase — Auth for matchmaker sign-in and Firestore for real-time client/match data,
with a mock-data mode so the app is fully explorable offline with zero config. The whole
experience is mobile-first and ships as an installable PWA: a Workbox service worker
precaches the app shell and runtime-caches data (NetworkFirst) and avatars/fonts
(CacheFirst), so it cold-starts offline and shows the last-synced data. Framer Motion
drives the micro-interactions (score-ring count-up, swipe-to-send, page transitions),
all gated behind `prefers-reduced-motion`.

**Matching logic.** Matchmaking is a deterministic, gender-specific rules engine. For
**male clients** it first applies hard filters — the candidate must be younger, not
taller, and not out-earn the client by more than 10% — eliminating anyone who fails,
then scores survivors on a 100-point soft matrix (children, religion, city, education,
lifestyle, age gap). For **female clients** there are no hard filters; instead a weighted
compatibility matrix scores profession, family values, relocation flexibility,
religion/caste, lifestyle, and children/family. Every candidate gets a 0–100 score that
maps to a **tier** (High ≥75, Medium ≥50, Low) plus actionable **flags** — red
deal-breakers (manglik mismatch, opposing views on children, strict veg vs non-veg), gold
highlights (shared hobbies, same city + religion), and amber cautions (large age/income
gaps) — so the matchmaker sees not just a number but *why*.

**AI integration.** On top of the rules engine, an AI layer (Google Gemini, called
through a serverless proxy so the API key never touches the browser) produces a
second-opinion compatibility read and drafts the introduction. The scorer returns a
**combined score weighted 60% algorithm / 40% AI** with strengths, cautions, and
deal-breakers; the email generator writes a culturally-aware, score-free introduction
plus a WhatsApp version. The proxy speaks a provider-neutral
`{ messages, systemPrompt } → { text }` contract (the assignment specced Claude; this
build runs on Gemini behind the same pattern, so swapping providers touches one file).
Key assumptions: it's an **internal matchmaker tool** (not consumer-facing), tuned for an
**Indian matrimonial context**, the introduction email is a **mock preview** (copy/send
is simulated, not wired to a mail provider), the 120 profiles are **realistic generated
dummy data**, and the AI **degrades gracefully** to the rules-engine breakdown ("manual
matching mode") whenever it's unavailable — the user never sees a raw error.

---

## Final checklist

| # | Item | Status |
| - | ---- | ------ |
| 1 | Login works with demo credentials | ✅ Code-complete (mock mode: any creds) |
| 2 | Dashboard shows customer list with status badges | ✅ |
| 3 | Customer detail shows all biodata fields | ✅ |
| 4 | Matches page shows ranked matches with scores | ✅ |
| 5 | AI Analysis button calls the AI and shows result | ✅ (Gemini; falls back to rules engine if unavailable) |
| 6 | Send Match → modal → success toast → status update | ✅ (+ confetti, MATCHED on first send) |
| 7 | Intro email can be copied from preview | ✅ |
| 8 | App works on a 375px screen | ✅ (mobile-first) |
| 9 | App installs as a PWA on mobile | ✅ (manifest + icons + SW) |
| 10 | Vercel deployment live with correct env vars | ⏳ Config ready (`vercel.json` + env table) — deploy step |
| 11 | GitHub repo public with complete README | ⏳ README done — push + make public |
| 12 | Write-up included in submission email | ✅ (above; copy into the email) |

✅ = built & verified in code (typecheck + lint + production build all pass).
⏳ = requires the human deploy/publish action documented in the README.
