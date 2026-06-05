# TDC Matchmaker Dashboard - Design System

## 1. COLOR SYSTEM

**Design Philosophy:** The color palette aims to convey a sense of premium Indian matchmaking—warm, trustworthy, and elegant. We use a deep crimson as the anchor (a nod to auspicious Indian wedding colors) balanced by warm creams and clean whites to maintain a professional SaaS feel.

### Primary Brand Color (Crimson)
* **Base (600):** `#9B1B30` (Primary UI actions)
* **50:** `#FAF0F2` (Subtle backgrounds, hover states)
* **100:** `#F2D8DE` (Selected states)
* **300:** `#DC9CAE` (Disabled buttons)
* **500:** `#BC3B5B` (Hover on primary buttons)
* **900:** `#4F0E18` (Dark contrasts)

### Secondary Accent Color (Champagne Gold)
* **Base:** `#D4AF37` (Highlighting premium features, tier labels)

### Semantic Colors
* **Success:** `#10B981` (High compatibility, active status)
* **Warning:** `#F59E0B` (Medium compatibility, missing bio info)
* **Error:** `#EF4444` (Low compatibility, validation errors)
* **Info:** `#3B82F6` (System notifications)

### Surface Colors
* **Background:** `#FDFBF7` (Warm cream, easier on eyes during long sessions)
* **Card/Surface:** `#FFFFFF` (Pure white for high contrast content blocks)
* **Sidebar/Nav:** `#F7F3EB` (Slightly deeper cream to distinguish layout hierarchy)
* **Divider/Border:** `#E5E0D8` (Soft structural lines)

### Text Colors
* **Primary:** `#1E293B` (Deep slate, softer than pure black)
* **Secondary:** `#475569` (For secondary info like age, city, subtitles)
* **Disabled/Placeholder:** `#94A3B8`
* **Inverse:** `#FFFFFF` (Text on primary crimson buttons/cards)

### Status Badge Colors (Bg / Text)
* **Active:** `#ECFDF5` / `#065F46` (Success green tints)
* **Pending:** `#FFFBEB` / `#92400E` (Warning amber tints)
* **Matched:** `#FAF0F2` / `#9B1B30` (Primary crimson tints)
* **On Hold:** `#F1F5F9` / `#475569` (Slate grey tints)
* **Closed:** `#F3F4F6` / `#374151` (Neutral dark tints)

---

## 2. TYPOGRAPHY

**Font Choices:**
* **Headings:** `Playfair Display` (Google Fonts) - Provides an elegant, editorial, and premium feel.
* **UI & Body text:** `Inter` (Google Fonts) - Exceptional legibility for dense data (biodatas, long Hindi names, numeric data).

### Type Scale & Breakpoints (Mobile / Desktop)
| Level | Font Family | Mobile Size / Line-height | Desktop Size / Line-height | Font Weight |
| :--- | :--- | :--- | :--- | :--- |
| **Display** | Playfair Display | 40px / 48px | 56px / 64px | SemiBold (600) |
| **H1** | Playfair Display | 32px / 40px | 40px / 48px | SemiBold (600) |
| **H2** | Playfair Display | 24px / 32px | 32px / 40px | SemiBold (600) |
| **H3** | Inter | 20px / 28px | 24px / 32px | Medium (500) |
| **H4** | Inter | 18px / 24px | 20px / 28px | Medium (500) |
| **Body Lg** | Inter | 16px / 24px | 18px / 28px | Regular (400) |
| **Body** | Inter | 14px / 20px | 16px / 24px | Regular (400) |
| **Body Sm** | Inter | 12px / 16px | 14px / 20px | Regular (400) |
| **Caption** | Inter | 11px / 16px | 12px / 16px | Regular (400) |
| **Overline** | Inter | 10px / 14px | 11px / 16px | Medium (500), Uppercase, Tracking-wide |

---

## 3. SPACING & LAYOUT

### Base Unit & Scale
Uses a baseline 8px grid, with 4px intervals for micro-adjustments.
* **xs:** 4px
* **sm:** 8px
* **md:** 16px
* **lg:** 24px
* **xl:** 32px
* **2xl:** 48px
* **3xl:** 64px

### Breakpoints & Grids
| Breakpoint | Name | Margin | Gutter | Columns |
| :--- | :--- | :--- | :--- | :--- |
| **375px** | Mobile (`sm`) | 16px | 16px | 4 |
| **768px** | Tablet (`md`) | 32px | 24px | 8 |
| **1024px**| Laptop (`lg`) | 48px | 24px | 12 |
| **1280px**| Desktop (`xl`)| Auto (max 1200px) | 24px | 12 |

### Safe Areas
Mobile web apps must account for iOS/Android system bars:
* `padding-bottom: env(safe-area-inset-bottom)` for bottom navigation/sheets.
* `padding-top: env(safe-area-inset-top)` for top app bars.

---

## 4. COMPONENT SPECIFICATIONS

### ProfileCard
* **Props:** `user: { name, age, gender, city, occupation, avatar_url, status }`
* **States:** Default, Hover (subtle shadow increase), Active/Selected.
* **Variants:** 
  * *Mobile:* Horizontal layout, avatar on left, 3 lines of text max, badge top right.
  * *Desktop:* Can be grid (vertical layout, larger avatar) or list (horizontal).

### StatusBadge
* **Props:** `status: 'Active' | 'Pending' | 'Matched' | 'On Hold' | 'Closed'`
* **Styles:** Pill shape (`rounded-full`), `px-2.5 py-0.5`, Text size `Caption`.
* **Colors:** Uses the Status Badge Colors defined in Section 1.

### MatchCard
* **Props:** `profile`, `score` (0-100), `tier` ('High', 'Medium', 'Low')
* **Layout:** Top section contains ProfileCard data. Bottom section features AI score and tier.
* **CTA:** Includes a primary "Send Match" button.
* **Variant:** 
  * *Mobile:* Full width. CTA spans 100% width.
  * *Desktop:* Card width constrained. CTA is right-aligned.

### ScoreRing
* **Props:** `score` (integer), `size` ('sm', 'md', 'lg')
* **Visuals:** SVG circular progress. 
  * Background ring: `#E5E0D8`. 
  * Progress ring: `< 50`: Warning/Error colors; `50-80`: Accent Gold; `> 80`: Success Green.
* **Center text:** Score out of 100 in `Playfair Display`.

### BioField
* **Props:** `label` (string), `value` (string | ReactNode)
* **Layout:** Vertical stack (Mobile) or Horizontal grid (Desktop, `col-span-1` label, `col-span-2` value).
* **Typography:** Label is `Body Sm` (Secondary text). Value is `Body` (Primary text).

### BottomSheet (Mobile Only)
* **Usage:** Replaces complex modals on mobile (e.g., Match Filtering).
* **Animation:** Slides up from bottom. Background overlay fades in (bg-black/50).
* **UI:** Top grab handle (`w-12 h-1.5 rounded-full bg-divider`), border-top-radius of 16px. Content is scrollable.

### Drawer (Desktop Only)
* **Usage:** Sidebar navigation or detailed filter panel.
* **Animation:** Slides in from left (Nav) or right (Filters).

### PrimaryButton / SecondaryButton / IconButton
* **Props:** `size` ('sm', 'md', 'lg'), `isDisabled` (bool), `isLoading` (bool), `leftIcon`, `rightIcon`
* **Primary:** Bg: Crimson 600. Text: White. Hover: Crimson 500. `rounded-lg`.
* **Secondary:** Bg: Transparent. Border: 1px solid Crimson 600. Text: Crimson 600. Hover: Crimson 50.
* **States:** Disabled state lowers opacity to 50% and disables pointer events.

---

## 5. ICONOGRAPHY

* **Library Recommendation:** **Lucide React** (Open source, consistent 2px stroke, modern look).
* **Essential Icons:**
  * `Users` (Client Roster)
  * `HeartHandshake` (Matches / Match Engine)
  * `UserCheck` (Approved Match)
  * `Sparkles` (AI Insights / Claude)
  * `MapPin` (Location/City)
  * `Briefcase` (Profession)
  * `GraduationCap` (Education)
  * `Send` (Send Match CTA)
  * `Filter` (Filtering pools)
  * `ChevronRight` / `ChevronDown` (Navigation / Accordions)

---

## 6. MOTION & MICRO-INTERACTIONS

* **Easing Function:** `cubic-bezier(0.4, 0, 0.2, 1)` (Tailwind's `ease-out`).
* **Durations:**
  * **Fast (150ms):** Hover states, button presses, toggles, filter chip selection.
  * **Base (250ms):** Toast notifications, dropdown menus, accordion expansion.
  * **Slow (400ms):** Page transitions, BottomSheet slide up, Match score ring fill animation.
* **Key Animations:**
  * **Match Reveal:** ScoreRing slowly fills from 0 to actual score (1.5s duration) while text counts up.
  * **Card Entrance:** Staggered fade and slide up (`translate-y-4` to `0`, opacity `0` to `1`).

---

## 7. TAILWIND CONFIGURATION

Save this as `tailwind.config.js` in your project root.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
      },
      colors: {
        brand: {
          50: '#FAF0F2',
          100: '#F2D8DE',
          300: '#DC9CAE',
          500: '#BC3B5B',
          600: '#9B1B30', // Primary Crimson
          900: '#4F0E18',
        },
        accent: {
          DEFAULT: '#D4AF37', // Champagne Gold
        },
        surface: {
          bg: '#FDFBF7',
          card: '#FFFFFF',
          sidebar: '#F7F3EB',
          divider: '#E5E0D8',
        },
        text: {
          primary: '#1E293B',
          secondary: '#475569',
          disabled: '#94A3B8',
          inverse: '#FFFFFF',
        },
        status: {
          success: { bg: '#ECFDF5', text: '#065F46', base: '#10B981' },
          warning: { bg: '#FFFBEB', text: '#92400E', base: '#F59E0B' },
          error: { bg: '#FEF2F2', text: '#991B1B', base: '#EF4444' },
          info: { bg: '#EFF6FF', text: '#1E40AF', base: '#3B82F6' },
        }
      },
      spacing: {
        '4xs': '4px',
        '3xs': '8px',
        '2xs': '12px',
        'xs': '16px',
        'sm': '24px',
        'md': '32px',
        'lg': '48px',
        'xl': '64px',
      },
      transitionDuration: {
        'fast': '150ms',
        'base': '250ms',
        'slow': '400ms',
      },
      transitionTimingFunction: {
        'app': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      boxShadow: {
        'card': '0 2px 8px -2px rgba(0, 0, 0, 0.05), 0 4px 16px -4px rgba(0, 0, 0, 0.02)',
        'float': '0 12px 32px -4px rgba(0, 0, 0, 0.08)', // For Modals/Bottom Sheets
      }
    },
  },
  plugins: [
    // Recommended plugins:
    // require('@tailwindcss/forms'),
    // require('@tailwindcss/typography'),
  ],
}
```
