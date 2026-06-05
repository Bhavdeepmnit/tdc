import { motion } from 'framer-motion';
import { Send, X, RefreshCw, Activity as ActivityIcon } from 'lucide-react';
import type { Activity, ActivityType } from '@types';
import { useAppStore } from '@store/useAppStore';
import { fromNow } from '@utils/date';
import { cn } from '@utils/cn';

export interface ActivityFeedProps {
  /** Max items to show (default 5). */
  limit?: number;
  /** Hide the "Recent Activity" heading (e.g. when shown inside a popover). */
  hideHeading?: boolean;
  className?: string;
}

const ICONS: Record<ActivityType, { icon: typeof Send; tone: string }> = {
  MATCH_SENT: { icon: Send, tone: 'bg-status-success-bg text-status-success-text' },
  MATCH_REJECTED: { icon: X, tone: 'bg-surface-sidebar text-text-secondary' },
  STATUS_CHANGED: { icon: RefreshCw, tone: 'bg-status-info-bg text-status-info-text' },
};

/**
 * Recent matchmaker activity (newest first). Reads from the global store, so it
 * updates live as matches are sent/passed. Renders the last `limit` entries with
 * a relative timestamp; shows a friendly empty state before any activity.
 *
 * Placement: desktop right-rail on the dashboard; inside the notification bell
 * popover on mobile.
 */
export function ActivityFeed({ limit = 5, hideHeading = false, className }: ActivityFeedProps) {
  // Select the stable array ref, then slice in render (avoids new-array selectors).
  const activities = useAppStore((s) => s.activities);
  const items = activities.slice(0, limit);

  return (
    <div className={cn('rounded-lg border border-surface-divider bg-surface-card p-xs', className)}>
      {!hideHeading && (
        <h3 className="mb-2xs flex items-center gap-1.5 text-overline uppercase tracking-wider text-text-secondary">
          <ActivityIcon className="h-3.5 w-3.5" aria-hidden />
          Recent Activity
        </h3>
      )}

      {items.length === 0 ? (
        <p className="py-2xs text-body-sm text-text-disabled">
          No activity yet. Sent matches and passes will appear here.
        </p>
      ) : (
        <ul className="space-y-1">
          {items.map((a, i) => (
            <ActivityRow key={a.id} activity={a} index={i} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ActivityRow({ activity, index }: { activity: Activity; index: number }) {
  const { icon: Icon, tone } = ICONS[activity.type];
  return (
    <motion.li
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.2) }}
      className="flex items-start gap-2xs py-1"
    >
      <span className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full', tone)}>
        <Icon className="h-3.5 w-3.5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-body-sm text-text-primary">
          <span className="font-medium">{activity.customerName}</span> · {activity.message}
        </p>
        <p className="text-caption text-text-disabled">{fromNow(activity.createdAt)}</p>
      </div>
    </motion.li>
  );
}
