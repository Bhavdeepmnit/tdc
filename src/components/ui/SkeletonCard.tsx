import { cn } from '@utils/cn';

export interface SkeletonCardProps {
  className?: string;
}

/** Pulsating shimmer block. */
function Bone({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded bg-surface-divider/60', className)} />;
}

/**
 * Skeleton loader matching ProfileCard dimensions.
 * Renders shimmer blocks in the exact avatar + text + badge layout so there's
 * no layout shift when real cards mount.
 */
export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-xs rounded-lg border border-surface-divider',
        'bg-surface-card p-xs shadow-card',
        className,
      )}
      aria-hidden="true"
    >
      {/* Avatar placeholder */}
      <Bone className="h-14 w-14 shrink-0 rounded-full lg:h-16 lg:w-16" />

      {/* Text lines */}
      <div className="min-w-0 flex-1 space-y-2">
        <Bone className="h-4 w-3/5" />
        <Bone className="h-3 w-2/5" />
        <Bone className="h-3 w-4/5 lg:block hidden" />
      </div>

      {/* Badge + chevron placeholder */}
      <div className="flex shrink-0 flex-col items-end gap-2">
        <Bone className="h-5 w-16 rounded-full" />
        <Bone className="h-4 w-4 rounded" />
      </div>
    </div>
  );
}
