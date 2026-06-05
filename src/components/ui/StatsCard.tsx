import { useEffect, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import { cn } from '@utils/cn';

export interface StatsCardProps {
  icon: LucideIcon;
  value: number;
  label: string;
  trend?: { value: number; direction: 'up' | 'down' };
  className?: string;
}

/** Animate a number counting up from 0 to `target`. */
function useCountUp(target: number, duration = 800) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);

      if (current !== start) {
        start = current;
        setCount(current);
      }
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }, [isInView, target, duration]);

  return { count, ref };
}

/**
 * Dashboard stats metric card.
 * Shows an icon, animated numeric value, descriptive label, and optional trend arrow.
 */
export function StatsCard({ icon: Icon, value, label, trend, className }: StatsCardProps) {
  const { count, ref } = useCountUp(value);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        'flex items-center gap-3xs rounded-lg border border-surface-divider',
        'bg-surface-card p-xs shadow-card',
        'min-w-[160px] shrink-0 snap-start',
        className,
      )}
    >
      {/* Icon */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50">
        <Icon className="h-5 w-5 text-brand-600" aria-hidden="true" />
      </div>

      {/* Value + Label */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-h3 font-semibold text-text-primary">{count}</span>
          {trend && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 text-caption font-medium',
                trend.direction === 'up' ? 'text-status-success-text' : 'text-status-error-text',
              )}
            >
              {trend.direction === 'up' ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {trend.value}%
            </span>
          )}
        </div>
        <p className="truncate text-caption text-text-secondary">{label}</p>
      </div>
    </motion.div>
  );
}
