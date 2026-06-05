import { useRef } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { cn } from '@utils/cn';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onFilterTap?: () => void;
  placeholder?: string;
  className?: string;
}

/**
 * Search input with a leading magnifying-glass icon, a clear (×) button when
 * text is present, and an optional trailing filter-icon button.
 *
 * Debouncing is handled by the parent via `useDebounce` so that both the raw
 * and debounced values remain accessible (e.g. for showing the typed query
 * instantly while delaying the filter computation).
 */
export function SearchBar({
  value,
  onChange,
  onFilterTap,
  placeholder = 'Search clients…',
  className,
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={cn('relative flex items-center', className)}>
      {/* Leading icon */}
      <Search
        className="pointer-events-none absolute left-3 h-4 w-4 text-text-disabled"
        aria-hidden="true"
      />

      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(
          'input-field pl-9',
          value && 'pr-20',
          !value && onFilterTap && 'pr-11',
        )}
        id="dashboard-search"
      />

      {/* Clear button */}
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange('');
            inputRef.current?.focus();
          }}
          className={cn(
            'absolute flex h-7 w-7 items-center justify-center rounded-full',
            'text-text-disabled hover:bg-surface-sidebar hover:text-text-secondary',
            'transition-colors duration-fast',
            onFilterTap ? 'right-11' : 'right-3',
          )}
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {/* Filter button */}
      {onFilterTap && (
        <button
          type="button"
          onClick={onFilterTap}
          className={cn(
            'absolute right-1.5 flex h-8 w-8 items-center justify-center rounded-lg',
            'text-text-secondary hover:bg-brand-50 hover:text-brand-600',
            'transition-colors duration-fast',
          )}
          aria-label="Open filters"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
