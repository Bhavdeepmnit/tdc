import { useEffect, useMemo, useState } from 'react';
import type { CustomerProfile } from '@types';
import { CustomerStatus } from '@types';
import { CUSTOMERS } from '@data/customers';

/** Return shape of {@link useMatchPool}. */
export interface UseMatchPoolResult {
  pool: CustomerProfile[];
  loading: boolean;
}

/**
 * Build the candidate pool to match a given customer against: the opposite
 * gender, excluding the customer themselves and anyone whose file is CLOSED.
 *
 * This is the *eligible universe* the ranking engine scores — it deliberately
 * does NOT apply soft preferences (those belong in the scorer), only the hard
 * gates that make a candidate inadmissible.
 */
export function useMatchPool(customer: CustomerProfile | null | undefined): UseMatchPoolResult {
  const [loading, setLoading] = useState(true);

  const pool = useMemo<CustomerProfile[]>(() => {
    if (!customer) return [];
    return CUSTOMERS.filter(
      (c) =>
        c.id !== customer.id &&
        c.gender !== customer.gender &&
        c.status !== CustomerStatus.CLOSED,
    );
  }, [customer]);

  useEffect(() => {
    setLoading(true);
    // Synchronous today; the flag models the eventual async fetch.
    setLoading(false);
  }, [customer]);

  return { pool, loading };
}
