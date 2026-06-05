import type { CustomerProfile } from '@types';
import type { CustomerStatus } from '@types';
import { getAge } from '@utils/date';

/**
 * Declarative filter criteria for the customer dataset. Every field is optional;
 * an absent (or empty) field is treated as "no constraint", so an empty object
 * returns the list unchanged. Criteria combine with AND.
 */
export interface FilterOptions {
  /** Free-text query matched (case-insensitively) against name, email, city, company, profession. */
  search?: string;
  status?: CustomerStatus;
  city?: string;
  /** Inclusive age window in years, `[min, max]`. */
  ageRange?: [number, number];
  religion?: string;
  gender?: CustomerProfile['gender'];
}

/** Normalise for case-insensitive comparison. */
const norm = (s: string) => s.trim().toLowerCase();

/** Does the customer match the free-text search across its key fields? */
function matchesSearch(c: CustomerProfile, q: string): boolean {
  const haystack = [
    c.firstName,
    c.lastName,
    `${c.firstName} ${c.lastName}`,
    c.email,
    c.city,
    c.currentCompany,
    c.designation,
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(q);
}

/**
 * Filter a list of customer profiles by the supplied criteria.
 *
 * Pure and allocation-light: returns a new array, never mutates the input.
 * Unknown/empty criteria are ignored, so partial filter objects work as expected.
 *
 * @example
 * filterCustomers(CUSTOMERS, { city: 'Mumbai', gender: 'female', ageRange: [27, 34] })
 */
export function filterCustomers(
  customers: CustomerProfile[],
  filters: FilterOptions = {},
): CustomerProfile[] {
  const search = filters.search ? norm(filters.search) : '';
  const city = filters.city ? norm(filters.city) : '';
  const religion = filters.religion ? norm(filters.religion) : '';
  const [minAge, maxAge] = filters.ageRange ?? [];

  return customers.filter((c) => {
    if (search && !matchesSearch(c, search)) return false;
    if (filters.status && c.status !== filters.status) return false;
    if (city && norm(c.city) !== city) return false;
    if (religion && norm(c.religion) !== religion) return false;
    if (filters.gender && c.gender !== filters.gender) return false;

    if (minAge !== undefined || maxAge !== undefined) {
      const age = getAge(c.dateOfBirth);
      if (minAge !== undefined && age < minAge) return false;
      if (maxAge !== undefined && age > maxAge) return false;
    }

    return true;
  });
}
