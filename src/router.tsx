/* eslint-disable react-refresh/only-export-components -- this is the route table, not a component module */
import { Suspense, lazy, type ReactNode } from 'react';
import { createHashRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@components/ProtectedRoute';
import { Spinner } from '@components/ui/Spinner';

/**
 * Application route table.
 *
 * A *hash* router is used (createHashRouter) so the app deploys to static hosts
 * (Vercel/Netlify) with zero rewrite configuration — every URL is served by
 * index.html and routing happens client-side after the `#`.
 *
 * Pages are code-split with React.lazy: each route's JS is fetched on demand,
 * shrinking the initial bundle. A full-screen Spinner covers the load.
 *
 * Route map (per requirements):
 *   /                       → redirect to /login
 *   /login                  → LoginPage (public)
 *   /dashboard              → DashboardPage (protected)
 *   /customer/:id           → CustomerDetailPage (protected)
 *   /customer/:id/matches   → MatchesPage (protected)
 *   /search | /notifications | /profile → placeholders (protected)
 *   *                       → NotFoundPage
 */

// ── Lazily-loaded pages (named exports → default for React.lazy) ──
const LoginPage = lazy(() => import('@pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const DashboardPage = lazy(() =>
  import('@pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const CustomerDetailPage = lazy(() =>
  import('@pages/CustomerDetailPage').then((m) => ({ default: m.CustomerDetailPage })),
);
const MatchesPage = lazy(() =>
  import('@pages/MatchesPage').then((m) => ({ default: m.MatchesPage })),
);
const NotFoundPage = lazy(() =>
  import('@pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);
const SearchPage = lazy(() => import('@pages/SearchPage').then((m) => ({ default: m.SearchPage })));
const NotificationsPage = lazy(() =>
  import('@pages/NotificationsPage').then((m) => ({ default: m.NotificationsPage })),
);
const ProfilePage = lazy(() =>
  import('@pages/ProfilePage').then((m) => ({ default: m.ProfilePage })),
);

/** Suspense boundary with a full-screen loading state. */
function Suspended({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-surface-bg">
          <Spinner size="lg" label="Loading…" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

export const router = createHashRouter([
  { path: '/', element: <Navigate to="/login" replace /> },
  {
    path: '/login',
    element: (
      <Suspended>
        <LoginPage />
      </Suspended>
    ),
  },

  // Protected area — gated by <ProtectedRoute>.
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/dashboard',
        element: (
          <Suspended>
            <DashboardPage />
          </Suspended>
        ),
      },
      {
        path: '/customer/:id',
        element: (
          <Suspended>
            <CustomerDetailPage />
          </Suspended>
        ),
      },
      {
        path: '/customer/:id/matches',
        element: (
          <Suspended>
            <MatchesPage />
          </Suspended>
        ),
      },
      {
        path: '/search',
        element: (
          <Suspended>
            <SearchPage />
          </Suspended>
        ),
      },
      {
        path: '/notifications',
        element: (
          <Suspended>
            <NotificationsPage />
          </Suspended>
        ),
      },
      {
        path: '/profile',
        element: (
          <Suspended>
            <ProfilePage />
          </Suspended>
        ),
      },
    ],
  },

  {
    path: '*',
    element: (
      <Suspended>
        <NotFoundPage />
      </Suspended>
    ),
  },
]);
