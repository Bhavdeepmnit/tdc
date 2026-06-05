import { memo, type ReactNode, useState } from 'react';
import { Copy, Check, Eye, EyeOff } from 'lucide-react';
import { cn } from '@utils/cn';

export interface BioFieldProps {
  label: ReactNode;
  value: ReactNode;
  /** Optional leading icon (Lucide icon element). */
  icon?: ReactNode;
  /** When true, the value displays as dots until the user clicks to reveal. */
  masked?: boolean;
  /** When true, a copy icon is shown and clicking it copies the string value to clipboard. */
  copyable?: boolean;
  className?: string;
}

/**
 * A labelled biodata field with optional masking and clipboard copy.
 * Mobile: vertical stack. Desktop (sm+): horizontal grid (1 col label / 2 col value).
 */
function BioFieldComponent({
  label,
  value,
  icon,
  masked = false,
  copyable = false,
  className,
}: BioFieldProps) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const isEmpty = value == null || value === '';
  const displayValue = isEmpty ? '—' : masked && !revealed ? '••••••••' : value;

  const handleCopy = async () => {
    if (isEmpty || typeof value !== 'string') return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard API may not be available */
    }
  };

  return (
    <div className={cn('grid grid-cols-1 gap-0.5 sm:grid-cols-3 sm:gap-xs', className)}>
      <dt className="flex items-center gap-1.5 text-body-sm text-text-secondary sm:col-span-1">
        {icon && <span className="shrink-0 text-text-disabled" aria-hidden>{icon}</span>}
        {label}
      </dt>
      <dd className="flex items-center gap-1.5 text-body text-text-primary sm:col-span-2">
        <span className={cn(masked && !revealed && !isEmpty && 'tracking-wider select-none')}>
          {displayValue}
        </span>

        {/* Unmask toggle */}
        {masked && !isEmpty && (
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            className="shrink-0 text-text-disabled hover:text-text-secondary transition-colors duration-fast"
            aria-label={revealed ? `Hide ${label}` : `Show ${label}`}
          >
            {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        )}

        {/* Copy button */}
        {copyable && !isEmpty && typeof value === 'string' && (
          <button
            type="button"
            onClick={handleCopy}
            className={cn(
              'shrink-0 transition-colors duration-fast',
              copied ? 'text-status-success-text' : 'text-text-disabled hover:text-text-secondary',
            )}
            aria-label={copied ? 'Copied!' : `Copy ${label}`}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        )}
      </dd>
    </div>
  );
}

/** Memoised: biodata fields are static once rendered; skip re-renders on parent updates. */
export const BioField = memo(BioFieldComponent);
