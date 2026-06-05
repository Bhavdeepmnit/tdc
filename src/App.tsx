import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { MotionConfig } from 'framer-motion';
import { AuthProvider } from '@context/AuthContext';
import { ErrorBoundary } from '@components/ErrorBoundary';
import { router } from './router';

/**
 * Application root.
 * Wires up the auth provider, the hash router, and the global toast portal.
 * Toast styling mirrors the design system (card surface, brand accents).
 *
 * <MotionConfig reducedMotion="user"> makes every Framer Motion animation honour
 * the OS "reduce motion" setting (transforms collapse to opacity), so page
 * transitions, the bottom-nav indicator, and card springs are all covered.
 */
export default function App() {
  return (
    <MotionConfig reducedMotion="user">
    <ErrorBoundary>
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#FFFFFF',
            color: '#1E293B',
            border: '1px solid #E5E0D8',
            borderRadius: '12px',
            boxShadow: '0 12px 32px -4px rgba(0, 0, 0, 0.08)',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#10B981', secondary: '#FFFFFF' } },
          error: { iconTheme: { primary: '#EF4444', secondary: '#FFFFFF' } },
        }}
      />
    </AuthProvider>
    </ErrorBoundary>
    </MotionConfig>
  );
}
