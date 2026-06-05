import { AppShell } from '@components/layout/AppShell';
import { ActivityFeed } from '@components/features/ActivityFeed';

/**
 * Notifications: the full activity log (same source as the dashboard's bell /
 * right-rail feed), not truncated to the last few.
 */
export function NotificationsPage() {
  return (
    <AppShell title="Notifications">
      <div className="mx-auto w-full max-w-xl">
        <ActivityFeed limit={50} />
      </div>
    </AppShell>
  );
}
