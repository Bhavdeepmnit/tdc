# TDC Matchmaker Dashboard

Internal, mobile-first tool for **The Date Crew** matchmakers — manage clients, run a
gender-specific matching engine, score compatibility with AI, and send AI-drafted
introductions. Installable as a **PWA**.

Built with **Vite + React 18 + TypeScript**, **Tailwind CSS v3**, **React Router v6**
(hash router), **Firebase v10** (Auth + Firestore), **Zustand**, **Framer Motion**,
**React Hook Form + Zod**, **React Hot Toast**, **Day.js**, **Lucide**, and a
**Google Gemini** AI integration behind a serverless proxy.

> **Live URL:** _<add your Vercel URL after deploying, e.g. https://tdc-matchmaker.vercel.app>_

---

## Quick start

```bash
npm install
cp .env.example .env.local   # mock mode works with zero config
npm run dev                  # http://localhost:5173
```

The app ships with `VITE_USE_MOCK_DATA=true`, so it runs fully offline against
**120 bundled Indian biodata profiles** — **any email/password logs you in**.
Flip the flag to `false` and fill in `VITE_FIREBASE_*` to use a real Firebase project.

### Demo credentials (mock mode)

| Field    | Value                                            |
| -------- | ------------------------------------------------ |
| Email    | `matchmaker1@tdc.com` (any email works)          |
| Password | any non-empty value                              |
| Admin    | use an `admin@…` email for the admin role        |

---

## Scripts

| Command                              | Description                                    |
| ------------------------------------ | ---------------------------------------------- |
| `npm run dev`                        | Vite dev server (port 5173)                    |
| `npm run build`                      | Type-check then production build               |
| `npm run preview`                    | Preview the production build locally           |
| `npm run lint`                       | ESLint over `src`                              |
| `npm run typecheck`                  | `tsc --noEmit`                                 |
| `ANALYZE=1 npm run build`            | Build + write `dist/stats.html` (bundle map)   |
| `node scripts/generateCustomers.mjs` | Regenerate the 120-profile dataset             |
| `node scripts/generateIcons.mjs`     | Regenerate PWA icons from the brand SVG        |

### Seeding Firestore (live mode only)

```bash
# 1. Seed 120 customers + 2 matchmakers (matches the bundled dataset)
npx tsx --env-file=.env.local src/scripts/seedFirestore.ts

# 2. (optional) Seed Firebase Auth users
npx tsx --env-file=.env.local src/scripts/seedAuth.ts
```

The seed is **idempotent** (deterministic doc ids) and batches writes (≤500/commit).
It uses the Firebase client SDK, so your Firestore rules must permit the writes — run
against the emulator, or swap to `firebase-admin` (see the note at the foot of the file).

---

## Environment variables

Copy `.env.example` → `.env.local`. `VITE_*` vars are **public** (bundled into the
client); the rest are **server-only** and must be set in the Vercel dashboard, never
committed.

| Variable                       | Scope   | Purpose                                              |
| ------------------------------ | ------- | ---------------------------------------------------- |
| `VITE_USE_MOCK_DATA`           | client  | `true` → bundled data, no Firebase needed            |
| `VITE_CLAUDE_PROXY_URL`        | client  | AI proxy route (default `/api/claude`)               |
| `VITE_FIREBASE_API_KEY`        | client  | Firebase web config                                  |
| `VITE_FIREBASE_AUTH_DOMAIN`    | client  | Firebase web config                                  |
| `VITE_FIREBASE_PROJECT_ID`     | client  | Firebase web config                                  |
| `VITE_FIREBASE_STORAGE_BUCKET` | client  | Firebase web config                                  |
| `VITE_FIREBASE_APP_ID`         | client  | Firebase web config                                  |
| `GEMINI_API_KEY`               | server  | **Secret.** Google Gemini key (the AI provider)      |
| `GEMINI_MODEL`                 | server  | optional, default `gemini-2.0-flash`                 |

> **Note on the AI provider:** the serverless proxy lives at
> [`api/claude.ts`](api/claude.ts) (route `/api/claude`) but is backed by **Google
> Gemini**, not Anthropic. The proxy speaks a provider-neutral
> `{ messages, systemPrompt } → { text }` contract, so the client never knows or
> cares which model answers. To swap providers, only that one file changes.

---

## Architecture

```
.
├── api/claude.ts               # Edge proxy → Gemini (holds GEMINI_API_KEY, rate-limited)
├── public/                     # favicon, robots.txt, PWA icons (pwa-192/512, apple-touch, maskable)
├── scripts/                    # generateCustomers.mjs, generateIcons.mjs
├── vercel.json                 # SPA rewrites + security headers (CSP, HSTS, X-Frame-Options)
└── src/
    ├── components/
    │   ├── ui/                 # Button, StatusBadge, ScoreRing, Avatar, ErrorState, OfflineIndicator, …
    │   ├── layout/             # AppShell, Header, Sidebar, BottomNav
    │   └── features/           # ProfileCard, MatchCard, AIScorePanel, SendMatchModal,
    │                           #   EmailPreviewModal, ActivityFeed, NotificationBell
    ├── data/customers.ts       # 120 generated CustomerProfile records
    ├── hooks/                  # useCustomers, useMatchPool, useFocusTrap, useOnlineStatus, …
    ├── lib/                    # firebase, claude (AI client), matching (rules engine),
    │                           #   matchActions (send/reject), confetti
    ├── pages/                  # Login, Dashboard, CustomerDetail, Matches, …  (lazy-loaded)
    ├── store/useAppStore.ts    # Zustand: customers, matches, sent/rejected, activity feed
    ├── types/                  # CustomerProfile, Match, Activity, enums, …
    └── App.tsx · router.tsx · index.css
```

### Matching engine ([`src/lib/matching.ts`](src/lib/matching.ts))

Dual-mode, gender-specific:

- **Male clients** — hard filters first (candidate must be younger, not taller, and
  not out-earn the client by >10%); survivors are scored on a 100-pt soft matrix
  (children, religion, city, education, lifestyle, age gap).
- **Female clients** — no hard filters; a weighted 100-pt matrix (profession, values,
  relocation, religion/caste, lifestyle, children/family).

Scores map to **tiers** (HIGH ≥75, MEDIUM ≥50, LOW <50) and surface **flags**:
red deal-breakers, gold highlights, amber cautions.

### AI integration ([`src/lib/claude.ts`](src/lib/claude.ts))

- `aiScoreMatch()` — combined score = **algorithm 60% + AI 40%** + strengths /
  cautions / deal-breakers.
- `generateMatchIntro()` — subject + 3–4 paragraph email + WhatsApp version.
- **Graceful degradation:** every call falls back to deterministic text built from the
  rules-engine breakdown if the AI is unavailable ("Manual matching mode"). Raw errors
  are never shown to the user.

---

## Production hardening

**PWA** — installable, offline-capable (`vite-plugin-pwa`). Workbox: NetworkFirst for
Firestore data, CacheFirst for DiceBear avatars + Google Fonts; precached app shell for
offline cold-start.

**Performance** — routes are code-split (`React.lazy` + `Suspense`); `ProfileCard`,
`MatchCard`, `BioField` are `React.memo`'d; vendor chunks are split; images are
`loading="lazy"` with explicit dimensions.

> **react-window:** the two long lists are already bounded — Matches is paginated
> (10 + "load more") and the roster is filtered/searched. Virtualizing the animated,
> responsive 2-col grid (entrance stagger, pull-to-refresh) would regress UX for no real
> gain at the current scale. The hook point is documented; introduce `react-window` if a
> single roster grows into the thousands.

**Accessibility** — visible keyboard focus everywhere; modals trap focus + close on
Escape; `ScoreRing` is a `meter` with `aria-valuenow`; `StatusBadge` is `role="status"`;
all images have alt text; decorative icons are `aria-hidden`, icon-only buttons are
labelled; all motion respects `prefers-reduced-motion` (global `MotionConfig`).

---

## Deployment (Vercel)

1. Push the repo to GitHub (public).
2. In Vercel: **New Project → import the repo**. Framework preset auto-detects Vite;
   [`vercel.json`](vercel.json) supplies the SPA rewrites + security headers and leaves
   `/api/*` for the edge function.
3. **Settings → Environment Variables** — add (Production + Preview):
   - `GEMINI_API_KEY` (secret), `GEMINI_MODEL` (optional)
   - `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`,
     `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_APP_ID`
   - `VITE_USE_MOCK_DATA` = `false` (or `true` to demo without Firebase)
4. **Deploy.** The edge function at `/api/claude` is detected automatically.
5. (live mode) Run the seed script against your Firebase project, and add your Vercel
   domain to Firebase Auth → **Authorized domains**.

---

## Security notes

- `VITE_*` vars are public by design; Firebase access is controlled by Firestore Rules + Auth.
- The **Gemini key is never bundled** — the browser calls `/api/claude`, which injects
  the secret server-side and is rate-limited (10 req/min/IP).
- `vercel.json` sets CSP, HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options`,
  `Referrer-Policy`, and `Permissions-Policy`.
