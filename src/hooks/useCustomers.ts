import { useCallback, useEffect, useState } from 'react';
import type { CustomerProfile } from '@types';
import { CUSTOMERS } from '@data/customers';

/** Return shape of {@link useCustomers}. */
export interface UseCustomersResult {
  customers: CustomerProfile[];
  loading: boolean;
  error: Error | null;
  /** Re-run the query (e.g. after a mutation). */
  refetch: () => void;
}

/**
 * Load the customer list, optionally scoped to a single matchmaker.
 *
 * Reads from the bundled local dataset today; the async-style API
 * (loading/error/refetch) mirrors a Firestore query so swapping the source
 * later requires no call-site changes.
 *
 * @param matchmakerId - when provided, returns only that matchmaker's clients
 *                       (matched on `assignedMatchmakerId`). Omit for all.
 */
export function useCustomers(matchmakerId?: string | null): UseCustomersResult {
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [nonce, setNonce] = useState(0);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    try {
      const data = matchmakerId
        ? CUSTOMERS.filter((c) => c.assignedMatchmakerId === matchmakerId)
        : CUSTOMERS;
      if (!cancelled) setCustomers(data);
    } catch (err) {
      if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      if (!cancelled) setLoading(false);
    }
    return () => {
      cancelled = true;
    };
  }, [matchmakerId, nonce]);

  return { customers, loading, error, refetch };
}
