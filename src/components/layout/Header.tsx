import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@utils/cn';

export interface HeaderProps {
  title: string;
  /** Show a back button (mobile-first; navigates to `backTo` or history -1). */
  showBack?: boolean;
  /** Explicit back target; defaults to browser history. */
  backTo?: string;
  /** Optional trailing actions (e.g. filter icon button). */
  actions?: ReactNode;
  className?: string;
}

/**
 * Sticky page header with optional back button + title + trailing actions.
 * Honours the top safe-area inset for notched devices.
 */
export function Header({ title, showBack = false, backTo, actions, className }: HeaderProps) {
  const navigate = useNavigate();

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex items-center gap-2xs border-b border-surface-divider bg-surface-bg/95 px-xs py-2xs backdrop-blur',
        'pt-[max(env(safe-area-inset-top),0.75rem)]',
        className,
      )}
    >
      {showBack && (
        <button
          type="button"
          aria-label="Go back"
          onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
          className="-ml-1 flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary transition-colors duration-fast hover:bg-surface-sidebar hover:text-text-primary"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
      )}
      <h1 className="min-w-0 flex-1 truncate font-display text-h3 font-semibold text-text-primary">
        {title}
      </h1>
      {actions && <div className="flex items-center gap-1">{actions}</div>}
    </header>
  );
}
