import { useEffect, useState } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';
import { usePrefersReducedMotion } from '@hooks/index';
import { cn } from '@utils/cn';

/** Count-up reveal duration + ease-out curve (design system "Match Reveal"). */
const REVEAL_DURATION = 1.2;
const EASE_OUT: [number, number, number, number] = [0, 0, 0.2, 1];

export interface ScoreRingProps {
  /** Score 0–100. */
  score: number;
  size?: 'sm' | 'md' | 'lg';
  /** Animate the ring + number counting up on mount (the "match reveal"). */
  animateReveal?: boolean;
  className?: string;
}

const DIMENSIONS = {
  sm: { box: 56, stroke: 5, font: 'text-body-sm' },
  md: { box: 96, stroke: 7, font: 'text-h4' },
  lg: { box: 140, stroke: 9, font: 'text-h2' },
} as const;

/** Progress-ring colour by score band (design system: <50 error, 50–80 gold, >80 success). */
function colourForScore(score: number): string {
  if (score > 80) return '#10B981'; // success green
  if (score >= 50) return '#D4AF37'; // accent gold
  return '#EF4444'; // error
}

/**
 * Circular SVG progress ring showing a compatibility score out of 100.
 * When `animateReveal` is set, the arc fills from 0 and the centre number
 * counts up (the "Match Reveal" interaction in the design system).
 */
export function ScoreRing({ score, size = 'md', animateReveal = false, className }: ScoreRingProps) {
  const { box, stroke, font } = DIMENSIONS[size];
  const radius = (box - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const colour = colourForScore(score);

  // Honour reduced-motion: skip the count-up + arc reveal entirely.
  const reduceMotion = usePrefersReducedMotion();
  const reveal = animateReveal && !reduceMotion;

  // Animated value for the count-up number.
  const count = useMotionValue(reveal ? 0 : score);
  const [display, setDisplay] = useState(reveal ? 0 : score);

  useEffect(() => {
    if (!reveal) {
      setDisplay(score);
      return;
    }
    const controls = animate(count, score, {
      duration: REVEAL_DURATION,
      ease: EASE_OUT,
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return controls.stop;
  }, [score, reveal, count]);

  const offset = circumference * (1 - score / 100);

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: box, height: box }}
      role="meter"
      aria-valuenow={score}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Compatibility score ${score} out of 100`}
    >
      <svg width={box} height={box} className="-rotate-90">
        {/* Track */}
        <circle
          cx={box / 2}
          cy={box / 2}
          r={radius}
          fill="none"
          stroke="#E5E0D8"
          strokeWidth={stroke}
        />
        {/* Progress */}
        <motion.circle
          cx={box / 2}
          cy={box / 2}
          r={radius}
          fill="none"
          stroke={colour}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: reveal ? circumference : offset }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: reveal ? REVEAL_DURATION : 0, ease: EASE_OUT }}
        />
      </svg>
      <span
        className={cn(
          'absolute inset-0 flex items-center justify-center font-display font-semibold text-text-primary',
          font,
        )}
      >
        {display}
      </span>
    </div>
  );
}
