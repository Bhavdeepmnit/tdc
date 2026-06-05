import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from '@context/AuthContext';

/**
 * Access the authentication context.
 * @throws if used outside of an <AuthProvider>.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>.');
  }
  return ctx;
}
