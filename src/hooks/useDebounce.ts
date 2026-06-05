import { useEffect, useState } from 'react';

/**
 * Debounce a rapidly-changing value.
 *
 * Returns a copy of `value` that only updates after `delay` ms of inactivity.
 * Commonly paired with search inputs to avoid filtering on every keystroke.
 *
 * @param value - the value to debounce
 * @param delay - debounce window in milliseconds (default 300)
 *
 * @example
 * const [query, setQuery] = useState('');
 * const debouncedQuery = useDebounce(query, 300);
 * // `debouncedQuery` updates 300ms after the user stops typing.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
