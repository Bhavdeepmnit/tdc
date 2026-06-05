import type { ReactNode } from 'react';
import { Header, type HeaderProps } from './Header';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { OfflineIndicator } from '@components/ui/OfflineIndicator';
import { cn } from '@utils/cn';

export interface AppShellProps extends HeaderProps {
  children: ReactNode;
  /** Constrain content to the design system's 1200px max + center it. */
  constrained?: boolean;
  /** Extra classes for the scrollable content region. */
  contentClassName?: string;
}

/**
 * Responsive application shell:
 *  - Desktop (lg+): fixed left Sidebar + content.
 *  - Mobile/tablet (<lg): content + fixed bottom navigation.
 * Always renders a sticky Header. Adds bottom padding on mobile so content
 * isn't hidden behind the BottomNav (incl. safe-area inset).
 */
export function AppShell({
  children,
  constrained = true,
  contentClassName,
  ...headerProps
}: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-surface-bg">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <OfflineIndicator />
        <Header {...headerProps} />

        <main
          className={cn(
            'flex-1 px-xs py-xs',
            // Leave room for the bottom nav on mobile (h ~ 60px + safe area).
            'pb-[calc(env(safe-area-inset-bottom)+5rem)] md:pb-xs',
            'sm:px-md lg:px-lg',
            contentClassName,
          )}
        >
          <div className={cn(constrained && 'mx-auto w-full max-w-[1200px]')}>{children}</div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
