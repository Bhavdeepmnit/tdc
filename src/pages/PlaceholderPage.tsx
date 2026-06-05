import type { LucideIcon } from 'lucide-react';
import { AppShell } from '@components/layout/AppShell';
import { EmptyState } from '@components/ui/EmptyState';

export interface PlaceholderPageProps {
  title: string;
  icon: LucideIcon;
  description?: string;
}

/**
 * Generic "coming soon" page for secondary nav destinations
 * (Search, Notifications, Profile) that are out of MVP scope.
 */
export function PlaceholderPage({ title, icon, description }: PlaceholderPageProps) {
  return (
    <AppShell title={title}>
      <EmptyState
        icon={icon}
        title={`${title} — coming soon`}
        description={description ?? 'This area is not part of the current MVP.'}
      />
    </AppShell>
  );
}
