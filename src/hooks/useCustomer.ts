import { useEffect, useState } from 'react';
import type { CustomerProfile } from '@types';
import { CUSTOMERS } from '@data/customers';

/** Return shape of {@link useCustomer}. */
export interface UseCustomerResult {
  customer: CustomerProfile | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Load a single customer profile by id.
 *
 * Resolves `customer` to `null` and sets `error` when the id is unknown, so
 * callers can render a not-found state without throwing.
 */
export function useCustomer(customerId: string | undefined): UseCustomerResult {
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setCustomer(null);

    if (!customerId) {
      if (!cancelled) {
        setError(new Error('No customer id provided.'));
        setLoading(false);
      }
      return () => {
        cancelled = true;
      };
    }

    const found = CUSTOMERS.find((c) => c.id === customerId) ?? null;
    if (!cancelled) {
      if (!found) setError(new Error(`Customer "${customerId}" not found.`));
      setCustomer(found);
      setLoading(false);
    }
    return () => {
      cancelled = true;
    };
  }, [customerId]);

  return { customer, loading, error };
}
