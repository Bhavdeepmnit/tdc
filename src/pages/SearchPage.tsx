import { useMemo, useState } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import { useCustomers, useDebounce } from '@hooks/index';
import { filterCustomers } from '@utils/filterCustomers';
import { AppShell } from '@components/layout/AppShell';
import { SearchBar } from '@components/ui/SearchBar';
import { ProfileCard } from '@components/features/ProfileCard';
import { SkeletonCard } from '@components/ui/SkeletonCard';
import { EmptyState } from '@components/ui/EmptyState';

/**
 * Global directory: search across every registered person (all customer
 * profiles), not just one matchmaker's roster. Name / city / company / role
 * matching is handled by `filterCustomers`.
 */
export function SearchPage() {
  const { customers, loading } = useCustomers();
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 250);

  const results = useMemo(
    () => filterCustomers(customers, { search: debounced }),
    [customers, debounced],
  );

  return (
    <AppShell title="Search">
      <div className="mx-auto w-full max-w-[900px] space-y-xs">
        {/* Sticky search */}
        <div className="sticky top-0 z-20 -mx-xs bg-surface-bg px-xs pb-2xs pt-1">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search all profiles by name, city, company…"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-xs lg:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : results.length === 0 ? (
          <EmptyState
            icon={SearchIcon}
            title={query ? 'No profiles found' : 'Search the directory'}
            description={
              query
                ? 'Try a different name, city, or company.'
                : `Search across all ${customers.length} registered profiles.`
            }
          />
        ) : (
          <>
            <p className="text-caption text-text-disabled">
              {results.length} of {customers.length} profile{customers.length !== 1 ? 's' : ''}
            </p>
            <ul className="grid grid-cols-1 gap-xs lg:grid-cols-2">
              {results.map((profile, i) => (
                <li key={profile.id}>
                  <ProfileCard profile={profile} index={i} />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </AppShell>
  );
}
