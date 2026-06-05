import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  ArrowUpDown,
  HeartHandshake,
  ChevronDown,
} from 'lucide-react';
import { useCustomer, useIsDesktop } from '@hooks/index';
import { useAppStore } from '@store/useAppStore';
import type { ScoredMatch } from '@lib/matching';
import { AppShell } from '@components/layout/AppShell';
import { MatchCard } from '@components/features/MatchCard';
import { EmptyState } from '@components/ui/EmptyState';
import { Spinner } from '@components/ui/Spinner';
import { Button } from '@components/ui/Button';
import { cn } from '@utils/cn';
import { getAge } from '@utils/date';

/* ──────────────────────────────────────────────────────────────────── */
/*  Sort options                                                       */
/* ──────────────────────────────────────────────────────────────────── */

type SortKey = 'score' | 'age' | 'city' | 'income';

interface SortOption {
  key: SortKey;
  label: string;
  comparator: (a: ScoredMatch, b: ScoredMatch) => number;
}

const SORT_OPTIONS: SortOption[] = [
  {
    key: 'score',
    label: 'Score',
    comparator: (a, b) => b.score - a.score,
  },
  {
    key: 'age',
    label: 'Age',
    comparator: (a, b) => getAge(a.profile.dateOfBirth) - getAge(b.profile.dateOfBirth),
  },
  {
    key: 'city',
    label: 'City',
    comparator: (a, b) => a.profile.city.localeCompare(b.profile.city),
  },
  {
    key: 'income',
    label: 'Income',
    comparator: (a, b) => b.profile.incomeAnnual - a.profile.incomeAnnual,
  },
];

const PAGE_SIZE = 10;

/* ──────────────────────────────────────────────────────────────────── */
/*  MatchesPage                                                        */
/* ──────────────────────────────────────────────────────────────────── */

/**
 * Matches View: runs the gender-specific rules engine for the selected client
 * and lists potential matches with sort controls and progressive loading.
 *
 * Features:
 *  - Header: "[Name]'s Suggested Matches" + count
 *  - Sort bar: Score | Age | City | Income
 *  - MatchCard list (10 initially, load more)
 *  - Tier summary counts
 */
export function MatchesPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const { customer } = useCustomer(id);
  const { matches, loadingMatches, computeMatches } = useAppStore();

  // ── Compute matches on mount ──
  useEffect(() => {
    void computeMatches(id);
  }, [id, computeMatches]);

  // ── Sort state ──
  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);

  // ── Load-more state ──
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const loadMore = useCallback(() => {
    setVisibleCount((prev) => prev + PAGE_SIZE);
  }, []);

  // ── Sorted + paginated matches ──
  const sortOption = SORT_OPTIONS.find((o) => o.key === sortKey) ?? SORT_OPTIONS[0];

  const sorted = useMemo(
    () => [...matches].sort(sortOption.comparator),
    [matches, sortOption],
  );

  const visible = useMemo(
    () => sorted.slice(0, visibleCount),
    [sorted, visibleCount],
  );

  const hasMore = visibleCount < sorted.length;

  // ── Tier counts ──
  const tierCounts = useMemo(() => {
    const counts = { HIGH: 0, MEDIUM: 0, LOW: 0 };
    for (const m of matches) {
      counts[m.tier]++;
    }
    return counts;
  }, [matches]);

  // ── Handlers ──
  // Sending is handled end-to-end by the SendMatchModal inside MatchCard
  // (confetti + toast + persistence); the page only reacts to a "pass".
  const handlePass = (match: ScoredMatch) => {
    const name = `${match.profile.firstName} ${match.profile.lastName}`;
    toast(`Passed on ${name}`, { icon: '🙅' });
  };

  const clientName = customer ? `${customer.firstName} ${customer.lastName}` : 'Client';
  const title = `${clientName}'s Matches`;

  return (
    <AppShell title={title} showBack backTo={`/customer/${id}`}>
      {loadingMatches ? (
        <div className="flex justify-center py-lg">
          <Spinner size="lg" label="Finding compatible matches…" />
        </div>
      ) : matches.length === 0 ? (
        <EmptyState
          icon={HeartHandshake}
          title="No matches found"
          description="No compatible candidates in the pool yet. Try broadening this client's preferences — widen the age range, relax the city/relocation requirement, or reconsider strict diet/community filters — then recompute."
          action={
            <div className="flex flex-col items-center gap-2xs sm:flex-row">
              <Button variant="secondary" onClick={() => void computeMatches(id)}>
                Recompute matches
              </Button>
              <Button onClick={() => navigate(`/customer/${id}`)}>
                Edit preferences
              </Button>
            </div>
          }
        />
      ) : (
        <div className="space-y-xs">
          {/* ── Stats + Sort Bar ── */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center justify-between gap-2xs"
          >
            {/* Tier summary */}
            <div className="flex items-center gap-2xs">
              <p className="text-body-sm font-medium text-text-primary">
                {matches.length} match{matches.length !== 1 ? 'es' : ''}
              </p>
              <div className="flex gap-1.5">
                {tierCounts.HIGH > 0 && (
                  <span className="rounded-full bg-status-success-bg px-2 py-0.5 text-[10px] font-bold text-status-success-text">
                    {tierCounts.HIGH} High
                  </span>
                )}
                {tierCounts.MEDIUM > 0 && (
                  <span className="rounded-full bg-status-warning-bg px-2 py-0.5 text-[10px] font-bold text-status-warning-text">
                    {tierCounts.MEDIUM} Med
                  </span>
                )}
                {tierCounts.LOW > 0 && (
                  <span className="rounded-full bg-status-error-bg px-2 py-0.5 text-[10px] font-bold text-status-error-text">
                    {tierCounts.LOW} Low
                  </span>
                )}
              </div>
            </div>

            {/* Sort dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setSortMenuOpen((o) => !o)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg border border-surface-divider',
                  'bg-surface-card px-2xs py-1 text-body-sm text-text-secondary',
                  'hover:border-brand-300 transition-colors duration-fast',
                )}
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
                Sort: {sortOption.label}
                <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', sortMenuOpen && 'rotate-180')} />
              </button>

              {sortMenuOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setSortMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      'absolute right-0 top-full z-30 mt-1 min-w-[140px]',
                      'rounded-lg border border-surface-divider bg-surface-card shadow-float',
                    )}
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => {
                          setSortKey(opt.key);
                          setSortMenuOpen(false);
                        }}
                        className={cn(
                          'flex w-full items-center px-3 py-2 text-body-sm transition-colors',
                          opt.key === sortKey
                            ? 'bg-brand-50 font-medium text-brand-600'
                            : 'text-text-primary hover:bg-surface-sidebar',
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </div>
          </motion.div>

          {/* ── Match Cards ── */}
          <div className={cn('grid grid-cols-1 gap-xs', isDesktop && 'lg:grid-cols-2')}>
            {visible.map((match, i) => (
              <MatchCard
                key={match.profile.id}
                match={match}
                customer={customer ?? undefined}
                index={i}
                onPass={() => handlePass(match)}
              />
            ))}
          </div>

          {/* ── Load More ── */}
          {hasMore && (
            <div className="flex justify-center pt-xs">
              <Button variant="secondary" onClick={loadMore}>
                Load More ({sorted.length - visibleCount} remaining)
              </Button>
            </div>
          )}

          {/* ── End indicator ── */}
          {!hasMore && matches.length > PAGE_SIZE && (
            <p className="py-xs text-center text-caption text-text-disabled">
              Showing all {matches.length} matches
            </p>
          )}
        </div>
      )}
    </AppShell>
  );
}
