# The Date Crew (TDC) Matchmaker Dashboard MVP

## 1. PRD (Product Requirements Document)

### Executive Summary
The Date Crew (TDC) Matchmaker Dashboard is an internal tool designed to empower TDC's matchmaking team. It streamlines the management of clients, provides an intuitive interface for viewing customer details, and leverages a gender-specific matching engine and AI to score potential matches and generate introductory emails. The goal is to increase the efficiency of matchmakers and improve the quality of matches sent to clients.

### User Personas
* **Matchmaker (Primary):** Needs to quickly view their roster of clients, find suitable matches using the matching engine, read AI-generated compatibility insights, and send curated matches. 
* **Admin (Secondary):** Oversees all matchmakers, manages user access, and can view all clients in the system.

### Full User Story List & Acceptance Criteria

**Feature 1: Authentication**
* **Story:** As a Matchmaker, I want to log in with my credentials so that I can securely access my client roster.
  * *Given* I am on the login page, *When* I enter valid credentials, *Then* I am redirected to the Customer List Dashboard.
  * *Criteria:* Must support email/password; failed logins show clear error messages; session persists securely.

**Feature 2: Customer List Dashboard**
* **Story:** As a Matchmaker, I want to see a list of all my assigned clients so that I can manage my workload.
  * *Given* I am on the dashboard, *When* it loads, *Then* I see a list of my clients with key summary info (Name, Age, Gender, Status).
  * *Criteria:* List is paginated/lazy-loaded; searchable by name; filterable by active/inactive status.

**Feature 3: Customer Detail View**
* **Story:** As a Matchmaker, I want to view a client's full biodata so that I understand their background and preferences.
  * *Given* I click on a client, *When* the detail page loads, *Then* I see their full profile (demographics, family, preferences, etc.).
  * *Criteria:* Distinct sections for Personal, Professional, Family, and Preferences; visually distinct from the match view.

**Feature 4: Matching Engine**
* **Story:** As a Matchmaker, I want the system to suggest matches based on gender-specific rules so that I don't have to search manually.
  * *Given* I am viewing a client, *When* I navigate to the "Matches" tab, *Then* I see a list of potential matches from the opposite-gender pool sorted by compatibility tier (High, Medium, Low).
  * *Criteria:* 
    * Male clients: Algorithm prioritizes women who are younger, shorter, earn less/equal, and share views on children.
    * Female clients: Algorithm prioritizes men based on profession alignment, values, relocation willingness, and strict religion/caste filters.
    * Matches must show a 0-100 score and tier label.

**Feature 5: AI Match Scoring & Intro Generation**
* **Story:** As a Matchmaker, I want AI to explain why a match is good and draft an intro email so that I can quickly communicate with clients.
  * *Given* I am viewing a specific match, *When* the AI analysis completes, *Then* I see a generated explanation and a drafted email.
  * *Criteria:* Uses Anthropic Claude API; output is polite, culturally appropriate for India, and highlights specific compatibilities; text is editable by the matchmaker before sending.

**Feature 6: Send Match Action**
* **Story:** As a Matchmaker, I want to send a match to a client so that they can review the profile.
  * *Given* I am satisfied with a match, *When* I click "Send Match", *Then* a modal appears to confirm the email, and upon confirmation, the match status updates to "Sent".
  * *Criteria:* Simulated email sending (toast notification); status updates in the database.

### Out-of-Scope Items
* Direct customer-facing app or login.
* Payment processing or subscription management.
* Real-time chat functionality between clients.
* Complex calendar or date-scheduling tools.

---

## 2. TRD (Technical Requirements Document)

### Tech Stack
* **Frontend Framework:** React 18 (initialized via Vite 5)
* **Routing:** React Router v6
* **Styling:** Tailwind CSS 3.4
* **Backend & Database:** Supabase (PostgreSQL) or Firebase (Firestore v10) - *Supabase recommended for complex relational matching queries.*
* **Auth:** Supabase Auth / Firebase Auth
* **AI Provider:** Anthropic Claude API (`claude-3-5-sonnet-20240620` recommended as `claude-sonnet-4-20250514` does not yet exist publicly).
* **State Management:** Zustand or React Context API
* **Icons:** Lucide React

### API Integrations
* **Database/Auth (Supabase/Firebase):** CRUD operations for matchmakers, customers, matches, and notes.
* **Claude API:** Serverless function (Edge Function or Cloud Function) to securely call the Claude API for match generation to avoid exposing the API key on the frontend.

### Environment Variables
* `VITE_SUPABASE_URL` or `VITE_FIREBASE_PROJECT_ID`
* `VITE_SUPABASE_ANON_KEY` or `VITE_FIREBASE_API_KEY`
* `ANTHROPIC_API_KEY` (Stored ONLY in the backend/serverless environment)

### Performance Targets
* **LCP (Largest Contentful Paint):** < 2.5s on 3G mobile networks.
* **Responsive:** Mobile-first approach, functional on 375px screens with scaling to tablet (768px) and desktop (1280px).
* **API Latency:** AI intro generation should respond or stream within 3-5 seconds.

### Security Considerations
* **Auth:** JWT-based authentication.
* **API Key Handling:** Anthropic API keys must NEVER be bundled into the Vite frontend. Use an Edge Function proxy.
* **Row Level Security (RLS):** Ensure matchmakers can only query/edit their assigned clients (or as dictated by Admin roles).
* **PII Data:** Biodata contains highly sensitive PII. Ensure data is encrypted at rest (handled by Supabase/Firebase natively).

### Non-Functional Requirements
* **Maintainability:** Component-driven architecture with strict ESLint and Prettier rules.
* **Scalability:** Designed to handle 10,000+ profiles without client-side lag (use server-side pagination for matching pools).

---

## 3. App Flow (Screen Navigation Map)

### Screen Entry/Exit Conditions
1. **Login Screen:**
   * Entry: Unauthenticated user.
   * Exit: Successful login routes to `/dashboard`.
2. **Dashboard (Customer List):**
   * Entry: Authenticated user.
   * Exit: Clicking a client routes to `/client/:id`.
3. **Customer Detail View:**
   * Entry: Selected client from Dashboard.
   * Exit: "Back to Dashboard" or clicking "Find Matches" routes to `/client/:id/matches`.
4. **Matches View:**
   * Entry: From Customer Detail.
   * Exit: Clicking a match routes to `/client/:id/match/:matchId`.
5. **Match Detail (AI View):**
   * Entry: Selected match. Shows side-by-side comparison, AI score, and drafted intro.
   * Exit: "Send Match" triggers Modal.
6. **Send Match Modal:**
   * Entry: Triggered from Match Detail.
   * Exit: "Confirm" triggers toast success and state update. "Cancel" closes modal.

### State Transitions
* **Logged-out:** Redirected to Login.
* **Loading:** Skeleton screens used for Dashboard lists and Client Details. Spinner used for AI Generation.
* **Error:** Toast notifications for transient errors (e.g., "Failed to fetch matches"). Error boundaries for crash recovery.
* **Empty:** Illustrated empty states (e.g., "No matches found in this tier", "No clients assigned yet").
* **Success:** Green toast notifications (e.g., "Match sent successfully").

### Navigation Logic
* **Mobile (375px):** Bottom Navigation Bar (Dashboard, Profile, Settings).
* **Tablet/Desktop (768px/1280px):** Left Sidebar Navigation (collapsible on tablet, fixed on desktop).

---

## 4. UI/UX Brief

### Design Philosophy
* **Tone:** Empathetic, premium, trustworthy, and culturally respectful. It's a B2B internal tool, but it should feel like a high-end consumer app to keep matchmakers engaged.
* **Aesthetics:** Clean interface to manage high information density (biodatas are long). Use of whitespace and clear visual hierarchy.

### Color Palette
* **Primary (Trust & Heritage):** Crimson / Maroon (`#8B0000` or `#9B1B30`) - Auspicious Indian color, modernized.
* **Secondary (Premium Accent):** Soft Gold / Champagne (`#D4AF37` or `#F3E5AB`).
* **Background:** Off-White / Cream (`#FDFBF7`) for warmth, avoiding harsh pure white.
* **Surface/Cards:** Pure White (`#FFFFFF`) to pop against the cream background.
* **Text (Primary):** Deep Slate (`#1E293B`) instead of pure black.
* **Semantic:** 
  * Success/High Tier: Emerald Green (`#10B981`)
  * Warning/Medium Tier: Amber (`#F59E0B`)
  * Error/Low Tier: Rose (`#F43F5E`)

### Typography Scale
* **Typeface:** `Inter` for UI elements/data points (highly legible); `Playfair Display` for key headings (adds a premium, matrimonial feel).
* **Scale (Mobile -> Desktop):**
  * H1: 24px -> 32px (Playfair)
  * H2: 20px -> 24px (Playfair)
  * Body: 14px -> 16px (Inter)
  * Small/Labels: 12px -> 14px (Inter)

### Component Inventory
* **Cards:** Profile summary cards with subtle shadows, rounded corners (8px).
* **Badges:** Pill-shaped tags for traits (e.g., "Vegetarian", "Manglik", "Never Married").
* **Modals:** For confirming actions (Send Match).
* **Bottom Sheets:** For mobile filters (filtering match pools).
* **Forms:** Clean inputs with floating labels for editing notes/profiles.

### Mobile-Specific Patterns
* **Bottom Sheets:** Used instead of modals on mobile for complex interactions.
* **Thumb Zones:** Primary actions (like "Send Match" button) stick to the bottom of the screen on mobile.
* **Swipe:** Swipe left/right on match cards to quickly dismiss or save (optional enhancement).

### Accessibility Requirements
* WCAG AA compliance.
* Contrast ratio of at least 4.5:1 for text.
* Aria-labels on all icon-only buttons.
* Keyboard navigable dashboard.

---

## 5. Backend Schema (Supabase/PostgreSQL Recommended)

*Note: Below is outlined conceptually, adaptable to NoSQL (Firestore) or SQL (Supabase).*

### 1. `matchmakers`
* `id` (UUID/Auth ID)
* `full_name` (String)
* `email` (String)
* `role` (Enum: admin, matchmaker)
* `created_at` (Timestamp)

### 2. `customers` (Biodata)
* `id` (UUID)
* `matchmaker_id` (FK to matchmakers)
* `full_name` (String)
* `gender` (Enum: Male, Female)
* `date_of_birth` (Date) -> *Derived: Age*
* `height_cm` (Integer)
* **Religion & Community:**
  * `religion` (String: Hindu, Muslim, Sikh, Jain, Christian, etc.)
  * `caste` (String)
  * `sub_caste` (String)
  * `gotra` (String)
  * `mother_tongue` (String)
* **Astrology:**
  * `manglik_status` (Enum: Yes, No, Partial/Anshik)
* **Lifestyle:**
  * `diet` (Enum: Veg, Non-Veg, Eggetarian, Jain)
  * `smoking` (Enum: Yes, No, Occasionally)
  * `drinking` (Enum: Yes, No, Occasionally)
* **Education & Career:**
  * `education` (String: e.g., MBA, B.Tech)
  * `profession` (String)
  * `income_bracket` (String: e.g., 10-15 LPA, $100k+)
* **Location:**
  * `current_city` (String)
  * `relocation_willingness` (Boolean)
* **Family & Values:**
  * `family_type` (Enum: Nuclear, Joint)
  * `family_values` (Enum: Orthodox, Traditional, Moderate, Liberal)
* **Relationship:**
  * `marital_status` (Enum: Never Married, Divorced, Widowed, Awaiting Divorce)
  * `children` (Enum: No, Yes-Living together, Yes-Not living together)
  * `views_on_children` (String/Enum: Wants children, Doesn't want children, Open)
* `is_active` (Boolean)
* `created_at` (Timestamp)

### 3. `matches`
* `id` (UUID)
* `client_id` (FK to customers)
* `matched_profile_id` (FK to customers)
* `score` (Integer 0-100)
* `tier` (Enum: High, Medium, Low)
* `ai_explanation` (Text)
* `ai_draft_intro` (Text)
* `status` (Enum: Suggested, Sent, Accepted, Rejected, Passed)
* `created_at` (Timestamp)
* `updated_at` (Timestamp)

### 4. `notes`
* `id` (UUID)
* `customer_id` (FK to customers)
* `matchmaker_id` (FK to matchmakers)
* `content` (Text)
* `created_at` (Timestamp)

### Index Suggestions
* `customers(matchmaker_id)` - For fast loading of dashboard.
* `customers(gender, is_active)` - For rapid pooling of opposite-gender active candidates.
* `matches(client_id, status)` - To quickly load a client's match history.

---

## 6. Implementation Plan

### Phase 1: Setup & Docs
- [ ] Initialize React (Vite) + Tailwind CSS project.
- [ ] Setup ESLint, Prettier, and absolute imports.
- [ ] Configure Supabase/Firebase project and get API keys.
- [ ] Setup environmental variables and `.env` files.
- [ ] Implement foundational UI tokens (Colors, Typography) in `tailwind.config.js`.
- [ ] Setup React Router configuration.

### Phase 2: Auth + Data
- [ ] Build Login Screen UI.
- [ ] Implement Supabase/Firebase Auth (Email/Password).
- [ ] Define database schema and create tables/collections.
- [ ] Set up Row Level Security (RLS) / Firestore Rules.
- [ ] Write seed script to generate 100+ dummy Indian profiles with comprehensive biodata.
- [ ] Build API utility services for CRUD operations.

### Phase 3: UI Screens
- [ ] Build responsive layout wrapper (Sidebar for Desktop, Bottom Nav for Mobile).
- [ ] Build Customer List Dashboard (table/cards, pagination, filtering).
- [ ] Build Customer Detail View (Profile info, tabs for Biodata vs Matches).
- [ ] Create reusable UI components (Badges, Buttons, Profile Avatars).
- [ ] Ensure mobile responsiveness and touch-friendly targets.

### Phase 4: Matching Engine
- [ ] Implement gender-specific rules engine (filtering logic before AI scoring).
- [ ] *Male Client Logic:* Filter/sort for younger, shorter, income <= client.
- [ ] *Female Client Logic:* Filter/sort for aligned profession, values, location.
- [ ] Build Matches UI Tab (Displaying potential profiles).
- [ ] Implement Match detail comparison view.

### Phase 5: AI + Deploy
- [ ] Setup Edge Function / Serverless function for Anthropic Claude API.
- [ ] Write prompt engineering template for Match Scoring & Intro generation.
- [ ] Integrate Edge Function with Frontend (Trigger AI scoring on demand or pre-calculate).
- [ ] Build Send Match Modal and simulated email dispatch (toast notification).
- [ ] Final QA, Accessibility check (WCAG), and Performance audit.
- [ ] Deploy frontend to Vercel/Netlify.
- [ ] Handoff documentation to stakeholders.
