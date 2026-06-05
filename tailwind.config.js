/** @type {import('tailwindcss').Config} */
/**
 * TDC Matchmaker Dashboard — Tailwind theme.
 * Tokens mirror Docs/DESIGN_SYSTEM.md (colors, typography, spacing, motion).
 */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'ui-serif', 'Georgia', 'serif'],
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
        },
      },
      fontSize: {
        // Design-system type scale (desktop sizes; mobile handled via responsive utils).
        display: ['56px', { lineHeight: '64px', fontWeight: '600' }],
        h1: ['40px', { lineHeight: '48px', fontWeight: '600' }],
        h2: ['32px', { lineHeight: '40px', fontWeight: '600' }],
        h3: ['24px', { lineHeight: '32px', fontWeight: '500' }],
        h4: ['20px', { lineHeight: '28px', fontWeight: '500' }],
        'body-lg': ['18px', { lineHeight: '28px' }],
        body: ['16px', { lineHeight: '24px' }],
        'body-sm': ['14px', { lineHeight: '20px' }],
        caption: ['12px', { lineHeight: '16px' }],
        overline: ['11px', { lineHeight: '16px', letterSpacing: '0.05em', fontWeight: '500' }],
      },
      spacing: {
        '4xs': '4px',
        '3xs': '8px',
        '2xs': '12px',
        xs: '16px',
        sm: '24px',
        md: '32px',
        lg: '48px',
        xl: '64px',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-top': 'env(safe-area-inset-top)',
      },
      borderRadius: {
        sheet: '16px',
      },
      transitionDuration: {
        fast: '150ms',
        base: '250ms',
        slow: '400ms',
      },
      transitionTimingFunction: {
        app: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      boxShadow: {
        card: '0 2px 8px -2px rgba(0, 0, 0, 0.05), 0 4px 16px -4px rgba(0, 0, 0, 0.02)',
        float: '0 12px 32px -4px rgba(0, 0, 0, 0.08)',
      },
      keyframes: {
        'slide-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        'slide-up': 'slide-up 400ms cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-in': 'fade-in 250ms cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
