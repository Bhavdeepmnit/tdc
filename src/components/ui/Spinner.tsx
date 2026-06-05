import { Loader2 } from 'lucide-react';
import { cn } from '@utils/cn';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  /** Optional caption shown beneath the spinner. */
  label?: string;
  className?: string;
}

const SIZES = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-9 w-9' } as const;

/** Accessible loading indicator using Lucide's animated Loader2. */
export function Spinner({ size = 'md', label, className }: SpinnerProps) {
  return (
    <div role="status" aria-live="polite" className={cn('flex flex-col items-center gap-3xs', className)}>
      <Loader2 className={cn('animate-spin text-brand-600', SIZES[size])} aria-hidden="true" />
      {label && <span className="text-body-sm text-text-secondary">{label}</span>}
      <span className="sr-only">{label ?? 'Loading'}</span>
    </div>
  );
}
