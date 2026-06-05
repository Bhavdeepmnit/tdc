import { useEffect, useState } from 'react';

/**
 * Subscribe to a CSS media query and re-render on changes.
 * @param query - e.g. "(min-width: 1024px)"
 * @returns whether the query currently matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    setMatches(mql.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/** Convenience breakpoint hooks aligned with the design system. */
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');
export const useIsMobile = () => useMediaQuery('(max-width: 767px)');

/**
 * Whether the user has requested reduced motion (OS-level accessibility setting).
 * Gate non-essential animations on this — long durations, springs, confetti, etc.
 */
export const usePrefersReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)');
