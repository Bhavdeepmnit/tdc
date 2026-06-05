import { CustomerStatus, ENUM_LABELS } from '@types';
import { cn } from '@utils/cn';

export type StatusBadgeSize = 'sm' | 'md';

export interface StatusBadgeProps {
  status: CustomerStatus;
  /** `sm` for list rows, `md` for detail headers. Default `sm`. */
  size?: StatusBadgeSize;
  className?: string;
}

/** Per-status background/text colours from the design system's badge palette. */
const STATUS_STYLES: Record<CustomerStatus, string> = {
  [CustomerStatus.ACTIVE]: 'bg-[#ECFDF5] text-[#065F46]',
  [CustomerStatus.PENDING]: 'bg-[#FFFBEB] text-[#92400E]',
  [CustomerStatus.MATCHED]: 'bg-brand-50 text-brand-600',
  [CustomerStatus.ON_HOLD]: 'bg-[#F1F5F9] text-[#475569]',
  [CustomerStatus.CLOSED]: 'bg-[#F3F4F6] text-[#374151]',
};

const SIZE_STYLES: Record<StatusBadgeSize, string> = {
  sm: 'px-2 py-0.5 text-caption',
  md: 'px-2.5 py-1 text-body-sm',
};

/** Pill-shaped status indicator for a customer. */
export function StatusBadge({ status, size = 'sm', className }: StatusBadgeProps) {
  const isPending = status === CustomerStatus.PENDING;
  return (
    <span
      role="status"
      aria-label={`Status: ${ENUM_LABELS.CustomerStatus[status]}`}
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium whitespace-nowrap',
        STATUS_STYLES[status],
        SIZE_STYLES[size],
        className,
      )}
    >
      {/* Pending nudges for attention with a gentle pulse (disabled under reduced motion). */}
      {isPending && (
        <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse motion-reduce:animate-none" aria-hidden />
      )}
      {ENUM_LABELS.CustomerStatus[status]}
    </span>
  );
}
