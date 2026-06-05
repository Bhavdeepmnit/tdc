import { useCallback, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  UserCheck,
  Send,
  Clock,
  Search as SearchIcon,
} from 'lucide-react';
import { CustomerStatus, ENUM_LABELS } from '@types';
import { useCustomers, useDebounce, useIsDesktop } from '@hooks/index';
import { useAuth } from '@hooks/useAuth';
import { filterCustomers } from '@utils/filterCustomers';
import { getGreeting } from '@utils/date';
import { cn } from '@utils/cn';

import { AppShell } from '@components/layout/AppShell';
import { ProfileCard } from '@components/features/ProfileCard';
import { ActivityFeed } from '@components/features/ActivityFeed';
import { NotificationBell } from '@components/features/NotificationBell';
import { StatsCard } from '@components/ui/StatsCard';
import { Button } from '@components/ui/Button';
import { SearchBar } from '@components/ui/SearchBar';
import { SkeletonCard } from '@components/ui/SkeletonCard';
import { EmptyState } from '@components/ui/EmptyState';
import { FilterPanel, type FilterValues } from '@components/ui/FilterPanel';

/* ──────────────────────────────────────────────────────────────────── */
/*  Constants                                                          */
/* ──────────────────────────────────────────────────────────────────── */

/** Chip options: "All" + each visible status. */
const STATUS_CHIPS: Array<CustomerStatus | 'ALL'> = [
  'ALL',
  CustomerStatus.ACTIVE,
  CustomerStatus.PENDING,
  CustomerStatus.MATCHED,
  CustomerStatus.ON_HOLD,
];

const DEFAULT_FILTERS: FilterValues = {
  statuses: [],
  city: null,
  religion: null,
  ageRange: [18, 60],
};

/* ──────────────────────────────────────────────────────────────────── */
/*  Pull-to-Refresh hook                                               */
/* ──────────────────────────────────────────────────────────────────── */

function usePullToRefresh(onRefresh: () => void) {
  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (scrollRef.current && scrollRef.current.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setPulling(true);
    }
  }, []);

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!pulling) return;
      const diff = e.touches[0].clientY - startY.current;
      if (diff > 0) {
        setPullDistance(Math.min(diff * 0.4, 80));
      }
    },
    [pulling],
  );

  const onTouchEnd = useCallback(() => {
    if (pullDistance > 50) {
      onRefresh();
    }
    setPulling(false);
    setPullDistance(0);
  }, [pullDistance, onRefresh]);

  return { scrollRef, pullDistance, onTouchStart, onTouchMove, onTouchEnd };
}

/* ──────────────────────────────────────────────────────────────────── */
/*  Dashboard Page                                                     */
/* ──────────────────────────────────────────────────────────────────── */

/**
 * Main customer-list dashboard.
 *
 * Features:
 *  - Time-of-day greeting with matchmaker name
 *  - Stats strip (scroll on mobile, grid on desktop)
 *  - Sticky search bar with debounce (300ms)
 *  - Status filter chips (horizontal scroll)
 *  - Advanced FilterPanel (BottomSheet mobile / dropdown desktop)
 *  - Customer list with staggered card animations
 *  - Skeleton loading state (3 placeholder cards)
 *  - Empty state with illustration
 *  - FAB on mobile for quick search focus
 *  - Pull-to-refresh gesture on mobile
 */
export function DashboardPage() {
  const isDesktop = useIsDesktop();
  const { user } = useAuth();
  const { customers, loading, refetch } = useCustomers();

  // ── Local filter state ──
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const [statusChip, setStatusChip] = useState<CustomerStatus | 'ALL'>('ALL');
  const [advancedFilters, setAdvancedFilters] = useState<FilterValues>(DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);

  // ── Scroll position preservation ──
  const listRef = useRef<HTMLUListElement>(null);

  // ── Search input ref (for FAB focus) ──
  const searchInputRef = useRef<HTMLDivElement>(null);
  const focusSearch = useCallback(() => {
    const input = searchInputRef.current?.querySelector('input');
    input?.focus();
    input?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, []);

  // ── Pull-to-refresh ──
  const { scrollRef, pullDistance, onTouchStart, onTouchMove, onTouchEnd } =
    usePullToRefresh(refetch);

  // ── Computed stats ──
  const stats = useMemo(() => {
    const total = customers.length;
    const active = customers.filter((c) => c.status === CustomerStatus.ACTIVE).length;
    const pending = customers.filter((c) => c.status === CustomerStatus.PENDING).length;
    const matched = customers.filter((c) => c.status === CustomerStatus.MATCHED).length;
    return { total, active, pending, matched };
  }, [customers]);

  // ── Filtered list ──
  const filtered = useMemo(() => {
    // Combine chip filter + advanced filters
    const statusForFilter =
      statusChip !== 'ALL'
        ? statusChip
        : advancedFilters.statuses.length === 1
          ? advancedFilters.statuses[0]
          : undefined;

    let result = filterCustomers(customers, {
      search: debouncedQuery,
      status: statusForFilter,
      city: advancedFilters.city ?? undefined,
      religion: advancedFilters.religion ?? undefined,
      ageRange:
        advancedFilters.ageRange[0] !== 18 || advancedFilters.ageRange[1] !== 60
          ? advancedFilters.ageRange
          : undefined,
    });

    // If multiple statuses from advanced filter, filter those too
    if (
      statusChip === 'ALL' &&
      advancedFilters.statuses.length > 1
    ) {
      result = result.filter((c) => advancedFilters.statuses.includes(c.status));
    }

    return result;
  }, [customers, debouncedQuery, statusChip, advancedFilters]);

  // ── Active filter count (for badge on filter icon) ──
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (advancedFilters.statuses.length > 0) count++;
    if (advancedFilters.city) count++;
    if (advancedFilters.religion) count++;
    if (advancedFilters.ageRange[0] !== 18 || advancedFilters.ageRange[1] !== 60) count++;
    return count;
  }, [advancedFilters]);

  // ── Greeting ──
  const greeting = getGreeting();
  const firstName = user?.fullName?.split(' ')[0] ?? 'there';

  return (
    <AppShell title="My Clients" actions={!isDesktop ? <NotificationBell /> : undefined}>
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-md lg:items-start">
      <div
        ref={scrollRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Pull-to-refresh indicator */}
        <AnimatePresence>
          {pullDistance > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: pullDistance, opacity: pullDistance > 30 ? 1 : 0.4 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex items-center justify-center overflow-hidden"
            >
              <motion.div
                animate={{ rotate: pullDistance > 50 ? 180 : 0 }}
                className="text-brand-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </motion.div>
              <span className="ml-2 text-body-sm text-text-secondary">
                {pullDistance > 50 ? 'Release to refresh' : 'Pull to refresh'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Greeting ── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-xs"
        >
          <h1 className="font-display text-h3 lg:text-h2 text-text-primary">
            {greeting},{' '}
            <span className="text-brand-600">{firstName}</span>
          </h1>
          <p className="mt-0.5 text-body-sm text-text-secondary">
            {stats.total} client{stats.total !== 1 ? 's' : ''} in your roster
          </p>
        </motion.div>

        {/* ── Stats Strip ── */}
        <div
          className={cn(
            'mb-xs',
            isDesktop
              ? 'grid grid-cols-4 gap-xs'
              : 'flex gap-3xs overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory',
          )}
        >
          <StatsCard icon={Users} value={stats.total} label="Total Clients" />
          <StatsCard
            icon={UserCheck}
            value={stats.active}
            label="Active"
            trend={{ value: 12, direction: 'up' }}
          />
          <StatsCard icon={Send} value={stats.matched} label="Matches Sent" />
          <StatsCard icon={Clock} value={stats.pending} label="Pending Review" />
        </div>

        {/* ── Search Bar (sticky on mobile) ── */}
        <div
          ref={searchInputRef}
          className={cn(
            'relative z-20 mb-xs',
            !isDesktop && 'sticky top-0 -mx-xs bg-surface-bg px-xs pb-2xs pt-2xs',
          )}
        >
          <SearchBar
            value={query}
            onChange={setQuery}
            onFilterTap={() => setFilterOpen(true)}
            placeholder="Search by name, city, company…"
          />

          {/* Active filter badge */}
          {activeFilterCount > 0 && (
            <span
              className={cn(
                'absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none',
                'flex h-5 w-5 items-center justify-center rounded-full',
                'bg-brand-600 text-[10px] font-bold text-white',
                !isDesktop && 'right-[calc(0.75rem+16px)]',
              )}
            >
              {activeFilterCount}
            </span>
          )}

          {/* Filter panel (positioned relative to search bar on desktop) */}
          <FilterPanel
            open={filterOpen}
            onClose={() => setFilterOpen(false)}
            current={advancedFilters}
            onApply={setAdvancedFilters}
            customers={customers}
            isMobile={!isDesktop}
          />
        </div>

        {/* ── Status Filter Chips ── */}
        <div
          className="mb-xs flex gap-2xs overflow-x-auto scrollbar-hide pb-0.5"
          role="group"
          aria-label="Filter by status"
        >
          {STATUS_CHIPS.map((status) => {
            const active = statusChip === status;
            const count =
              status === 'ALL'
                ? customers.length
                : customers.filter((c) => c.status === status).length;

            return (
              <button
                key={status}
                onClick={() => setStatusChip(status)}
                aria-pressed={active}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2xs py-1',
                  'text-body-sm font-medium transition-all duration-fast whitespace-nowrap',
                  active
                    ? 'border-brand-600 bg-brand-600 text-text-inverse shadow-sm'
                    : 'border-surface-divider bg-surface-card text-text-secondary hover:border-brand-300 hover:bg-brand-50/50',
                )}
              >
                {status === 'ALL' ? 'All' : ENUM_LABELS.CustomerStatus[status]}
                <span
                  className={cn(
                    'flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-caption font-semibold',
                    active
                      ? 'bg-white/20 text-text-inverse'
                      : 'bg-surface-sidebar text-text-secondary',
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Customer List ── */}
        {loading ? (
          /* Skeleton loaders */
          <div className="grid grid-cols-1 gap-xs lg:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          /* Empty state */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {query || statusChip !== 'ALL' || activeFilterCount > 0 ? (
              <EmptyState
                icon={Users}
                title="No clients found"
                description="Try adjusting your search or filters."
              />
            ) : (
              <EmptyState
                icon={Users}
                title="No clients assigned yet"
                description="Reach out to your admin to get customers assigned to you."
                action={
                  <Button
                    variant="secondary"
                    onClick={() => window.open('mailto:admin@thedatecrew.com?subject=Client%20assignment%20request', '_self')}
                  >
                    Contact admin
                  </Button>
                }
              />
            )}
          </motion.div>
        ) : (
          /* Card grid */
          <ul
            ref={listRef}
            className="grid grid-cols-1 gap-xs lg:grid-cols-2"
          >
            {filtered.map((profile, i) => (
              <li key={profile.id}>
                <ProfileCard
                  profile={profile}
                  index={i}
                  isOnline={i % 3 === 0} /* demo: every 3rd client is "online" */
                  pendingMatches={i % 5 === 0 ? Math.ceil(Math.random() * 4) : undefined}
                />
              </li>
            ))}
          </ul>
        )}

        {/* Result count */}
        {!loading && filtered.length > 0 && (
          <p className="mt-xs text-center text-caption text-text-disabled">
            Showing {filtered.length} of {customers.length} client{customers.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

        {/* Desktop right rail: live activity feed */}
        <aside className="hidden lg:block lg:sticky lg:top-2">
          <ActivityFeed limit={6} />
        </aside>
      </div>

      {/* ── FAB: Quick Search (mobile only) ── */}
      {!isDesktop && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 260, damping: 20 }}
          onClick={focusSearch}
          className={cn(
            'fixed bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] right-4 z-30',
            'flex h-14 w-14 items-center justify-center rounded-full',
            'bg-brand-600 text-white shadow-float',
            'active:scale-95 transition-transform duration-fast',
          )}
          aria-label="Focus search bar"
        >
          <SearchIcon className="h-6 w-6" />
        </motion.button>
      )}
    </AppShell>
  );
}
