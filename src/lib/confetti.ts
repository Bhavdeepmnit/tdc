import confetti from 'canvas-confetti';

/**
 * Celebration confetti for the "match sent" success moment.
 *
 * No-ops when the user prefers reduced motion (checked imperatively here since
 * this fires outside React). Uses the TDC brand palette (crimson + champagne
 * gold + green) and resolves after the burst so callers can sequence UI.
 */

const BRAND_COLORS = ['#9B1B30', '#BC3B5B', '#D4AF37', '#10B981', '#FAF0F2'];

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** Fire a short, two-sided celebratory burst. Safe to call anywhere. */
export function celebrate(): void {
  if (prefersReducedMotion()) return;

  const defaults = {
    spread: 70,
    startVelocity: 40,
    ticks: 120,
    gravity: 1.1,
    colors: BRAND_COLORS,
    disableForReducedMotion: true,
    zIndex: 9999,
  } as const;

  // Centre pop + two angled side bursts for a fuller effect.
  confetti({ ...defaults, particleCount: 80, origin: { x: 0.5, y: 0.4 } });
  confetti({ ...defaults, particleCount: 40, angle: 60, origin: { x: 0, y: 0.6 } });
  confetti({ ...defaults, particleCount: 40, angle: 120, origin: { x: 1, y: 0.6 } });
}
