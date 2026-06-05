import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RotateCcw, Check } from 'lucide-react';
import { CustomerStatus, ENUM_LABELS } from '@types';
import type { CustomerProfile } from '@types';
import { Button } from '@components/ui/Button';
import { cn } from '@utils/cn';

/* ──────────────────────────────────────────────────────────────────── */
/*  Types                                                              */
/* ──────────────────────────────────────────────────────────────────── */

export interface FilterValues {
  statuses: CustomerStatus[];
  city: string | null;
  religion: string | null;
  ageRange: [number, number];
}

export interface FilterPanelProps {
  open: boolean;
  onClose: () => void;
  /** Currently active filters (so UI matches state). */
  current: FilterValues;
  /** Called when the user taps Apply. */
  onApply: (filters: FilterValues) => void;
  /** Customer list — used to derive unique city/religion options. */
  customers: CustomerProfile[];
  /** True if viewport is <1024px. Renders as BottomSheet on mobile, dropdown on desktop. */
  isMobile: boolean;
}

/* ──────────────────────────────────────────────────────────────────── */
/*  Constants                                                          */
/* ──────────────────────────────────────────────────────────────────── */

const ALL_STATUSES: CustomerStatus[] = [
  CustomerStatus.ACTIVE,
  CustomerStatus.PENDING,
  CustomerStatus.MATCHED,
  CustomerStatus.ON_HOLD,
  CustomerStatus.CLOSED,
];

const DEFAULT_AGE_RANGE: [number, number] = [18, 60];

/* ──────────────────────────────────────────────────────────────────── */
/*  Component                                                          */
/* ──────────────────────────────────────────────────────────────────── */

export function FilterPanel({
  open,
  onClose,
  current,
  onApply,
  customers,
  isMobile,
}: FilterPanelProps) {
  // ── Local draft state (committed on Apply) ──
  const [statuses, setStatuses] = useState<CustomerStatus[]>(current.statuses);
  const [city, setCity] = useState<string | null>(current.city);
  const [religion, setReligion] = useState<string | null>(current.religion);
  const [ageRange, setAgeRange] = useState<[number, number]>(current.ageRange);

  // Sync local state when panel opens with new `current` values.
  // (Handles external resets.)
  const [lastOpen, setLastOpen] = useState(open);
  if (open && !lastOpen) {
    setStatuses(current.statuses);
    setCity(current.city);
    setReligion(current.religion);
    setAgeRange(current.ageRange);
  }
  if (open !== lastOpen) setLastOpen(open);

  // ── Derived option lists ──
  const cities = useMemo(
    () => [...new Set(customers.map((c) => c.city))].sort(),
    [customers],
  );
  const religions = useMemo(
    () => [...new Set(customers.map((c) => c.religion))].sort(),
    [customers],
  );

  // ── Handlers ──
  const toggleStatus = (s: CustomerStatus) =>
    setStatuses((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );

  const handleApply = () => {
    onApply({ statuses, city, religion, ageRange });
    onClose();
  };

  const handleReset = () => {
    setStatuses([]);
    setCity(null);
    setReligion(null);
    setAgeRange(DEFAULT_AGE_RANGE);
  };

  const hasActiveFilters =
    statuses.length > 0 ||
    city !== null ||
    religion !== null ||
    ageRange[0] !== DEFAULT_AGE_RANGE[0] ||
    ageRange[1] !== DEFAULT_AGE_RANGE[1];

  // ── Panel body (shared between mobile bottom-sheet and desktop dropdown) ──
  const body = (
    <div className="space-y-sm">
      {/* Status multi-select */}
      <fieldset>
        <legend className="mb-2xs text-overline uppercase tracking-wider text-text-secondary">
          Status
        </legend>
        <div className="flex flex-wrap gap-2xs">
          {ALL_STATUSES.map((s) => {
            const selected = statuses.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleStatus(s)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border px-2xs py-1 text-body-sm font-medium',
                  'transition-colors duration-fast',
                  selected
                    ? 'border-brand-600 bg-brand-600 text-text-inverse'
                    : 'border-surface-divider bg-surface-card text-text-secondary hover:border-brand-300',
                )}
              >
                {selected && <Check className="h-3 w-3" />}
                {ENUM_LABELS.CustomerStatus[s]}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* City dropdown */}
      <div>
        <label
          htmlFor="filter-city"
          className="mb-1 block text-overline uppercase tracking-wider text-text-secondary"
        >
          City
        </label>
        <select
          id="filter-city"
          value={city ?? ''}
          onChange={(e) => setCity(e.target.value || null)}
          className="input-field"
        >
          <option value="">All Cities</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Religion dropdown */}
      <div>
        <label
          htmlFor="filter-religion"
          className="mb-1 block text-overline uppercase tracking-wider text-text-secondary"
        >
          Religion
        </label>
        <select
          id="filter-religion"
          value={religion ?? ''}
          onChange={(e) => setReligion(e.target.value || null)}
          className="input-field"
        >
          <option value="">All Religions</option>
          {religions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {/* Age range */}
      <div>
        <p className="mb-2xs text-overline uppercase tracking-wider text-text-secondary">
          Age Range
        </p>
        <div className="flex items-center gap-2xs">
          <input
            type="number"
            min={18}
            max={ageRange[1]}
            value={ageRange[0]}
            onChange={(e) =>
              setAgeRange([Math.max(18, +e.target.value), ageRange[1]])
            }
            className="input-field w-20 text-center"
            aria-label="Minimum age"
          />
          <span className="text-text-disabled">—</span>
          <input
            type="number"
            min={ageRange[0]}
            max={80}
            value={ageRange[1]}
            onChange={(e) =>
              setAgeRange([ageRange[0], Math.min(80, +e.target.value)])
            }
            className="input-field w-20 text-center"
            aria-label="Maximum age"
          />
          <span className="text-body-sm text-text-secondary">years</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2xs pt-2xs">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleReset}
          disabled={!hasActiveFilters}
          leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
          className="flex-1"
        >
          Reset
        </Button>
        <Button size="sm" onClick={handleApply} className="flex-1">
          Apply Filters
        </Button>
      </div>
    </div>
  );

  /* ── Mobile: BottomSheet ── */
  if (isMobile) {
    return (
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/40"
              onClick={onClose}
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className={cn(
                'fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto',
                'rounded-t-sheet bg-surface-card px-xs pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-xs',
                'shadow-float',
              )}
            >
              {/* Grab handle */}
              <div className="mx-auto mb-xs h-1.5 w-12 rounded-full bg-surface-divider" />

              {/* Header */}
              <div className="mb-xs flex items-center justify-between">
                <h3 className="text-h4 font-medium text-text-primary">Filters</h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-sidebar"
                  aria-label="Close filters"
                >
                  <X className="h-5 w-5 text-text-secondary" />
                </button>
              </div>

              {body}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  /* ── Desktop: Dropdown panel ── */
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Click-away overlay (transparent) */}
          <div className="fixed inset-0 z-30" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className={cn(
              'absolute right-0 top-full z-40 mt-2 w-[360px]',
              'rounded-lg border border-surface-divider bg-surface-card p-xs shadow-float',
            )}
          >
            <div className="mb-xs flex items-center justify-between">
              <h3 className="text-h4 font-medium text-text-primary">Filters</h3>
              <button
                type="button"
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-surface-sidebar"
                aria-label="Close filters"
              >
                <X className="h-4 w-4 text-text-secondary" />
              </button>
            </div>
            {body}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
