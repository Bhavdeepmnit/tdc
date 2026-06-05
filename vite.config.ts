import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';

/**
 * Vite configuration for the TDC Matchmaker Dashboard.
 *
 * - `@vitejs/plugin-react` enables React Fast Refresh + automatic JSX runtime.
 * - `VitePWA` ships an installable, offline-capable PWA with auto-updating SW.
 * - `rollup-plugin-visualizer` (only when ANALYZE=1) writes dist/stats.html.
 * - Path aliases (`@`, `@components`, ...) keep imports clean and refactor-safe;
 *   the matching aliases live in `tsconfig.json` under `compilerOptions.paths`.
 */
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt', 'apple-touch-icon.png'],
      workbox: {
        // Precache the built app shell (enables offline cold-start).
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // The SPA fallback must never swallow the serverless proxy route.
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            // Firestore reads (data API) — fresh first, fall back to cache offline.
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firestore-data',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Avatar images (DiceBear) — immutable assets, serve from cache.
            urlPattern: /^https:\/\/api\.dicebear\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'avatar-assets',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Google Fonts stylesheets + files — long-lived assets.
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        name: 'TDC Matchmaker',
        short_name: 'TDC',
        description:
          'Internal tool for The Date Crew matchmakers to manage clients and curate matches.',
        theme_color: '#9B1B30',
        background_color: '#FDFBF7',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
    // Bundle analysis: `ANALYZE=1 npm run build` → dist/stats.html
    ...(process.env.ANALYZE
      ? [visualizer({ filename: 'dist/stats.html', gzipSize: true, brotliSize: true })]
      : []),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
      '@pages': fileURLToPath(new URL('./src/pages', import.meta.url)),
      '@lib': fileURLToPath(new URL('./src/lib', import.meta.url)),
      '@hooks': fileURLToPath(new URL('./src/hooks', import.meta.url)),
      '@context': fileURLToPath(new URL('./src/context', import.meta.url)),
      '@types': fileURLToPath(new URL('./src/types', import.meta.url)),
      '@utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
      '@store': fileURLToPath(new URL('./src/store', import.meta.url)),
      '@data': fileURLToPath(new URL('./src/data', import.meta.url)),
      '@assets': fileURLToPath(new URL('./src/assets', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  build: {
    rollupOptions: {
      output: {
        /**
         * Split heavy, rarely-changing vendor code into stable chunks so a code
         * change doesn't bust the whole bundle's cache (and to clear Vite's
         * 500 kB single-chunk warning).
         */
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'vendor-motion': ['framer-motion'],
        },
      },
    },
  },
});
