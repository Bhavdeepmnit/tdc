import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { Spinner } from '@components/ui/Spinner';
import { AnimatedOutlet } from '@components/AnimatedOutlet';

/**
 * Route guard for authenticated areas of the app.
 *
 * - While the auth state resolves → full-screen spinner (avoids a login flash).
 * - When unauthenticated → redirect to /login, preserving the attempted path in
 *   `location.state.from` so we can return there after a successful login.
 * - When authenticated → render nested routes via the animated outlet.
 */
export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-bg">
        <Spinner size="lg" label="Checking your session…" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <AnimatedOutlet />;
}
