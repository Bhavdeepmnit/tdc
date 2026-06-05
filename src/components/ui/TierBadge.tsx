import { ENUM_LABELS, MatchTier } from '@types';
import { cn } from '@utils/cn';

export interface TierBadgeProps {
  tier: MatchTier;
  className?: string;
}

/** Colour mapping: High→success, Medium→warning(gold), Low→error. */
const TIER_STYLES: Record<MatchTier, string> = {
  [MatchTier.HIGH]: 'bg-status-success-bg text-status-success-text',
  [MatchTier.MEDIUM]: 'bg-status-warning-bg text-status-warning-text',
  [MatchTier.LOW]: 'bg-status-error-bg text-status-error-text',
};

/** Pill badge labelling a match's compatibility tier. */
export function TierBadge({ tier, className }: TierBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-caption font-semibold uppercase tracking-wide',
        TIER_STYLES[tier],
        className,
      )}
    >
      {ENUM_LABELS.MatchTier[tier]}
    </span>
  );
}
