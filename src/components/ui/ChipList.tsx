import { cn } from '@utils/cn';

export interface ChipListProps {
  items: string[];
  /** Optional max items to show; renders "+N more" if exceeded. */
  max?: number;
  className?: string;
}

/**
 * Horizontal scrollable list of pill-shaped chips.
 * Used for languages, hobbies, and other string-array fields.
 */
export function ChipList({ items, max, className }: ChipListProps) {
  if (!items || items.length === 0) {
    return <span className="text-body text-text-disabled">—</span>;
  }

  const visible = max ? items.slice(0, max) : items;
  const remaining = max ? items.length - max : 0;

  return (
    <div
      className={cn(
        'flex flex-wrap gap-1.5',
        className,
      )}
    >
      {visible.map((item) => (
        <span
          key={item}
          className={cn(
            'inline-flex items-center rounded-full border border-surface-divider',
            'bg-surface-sidebar px-2.5 py-0.5 text-caption font-medium text-text-secondary',
            'whitespace-nowrap',
          )}
        >
          {item}
        </span>
      ))}
      {remaining > 0 && (
        <span
          className={cn(
            'inline-flex items-center rounded-full',
            'bg-brand-50 px-2.5 py-0.5 text-caption font-medium text-brand-600',
          )}
        >
          +{remaining} more
        </span>
      )}
    </div>
  );
}
