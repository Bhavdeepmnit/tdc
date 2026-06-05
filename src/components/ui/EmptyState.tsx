import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@utils/cn';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  /** Optional CTA (e.g. a Button). */
  action?: ReactNode;
  className?: string;
}

/** Illustrated empty state for lists with no results (per App Flow spec). */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-xs py-lg text-center', className)}>
      <div className="mb-xs flex h-16 w-16 items-center justify-center rounded-full bg-brand-50">
        <Icon className="h-7 w-7 text-brand-600" aria-hidden="true" />
      </div>
      <h3 className="text-h4 font-medium text-text-primary">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-body-sm text-text-secondary">{description}</p>}
      {action && <div className="mt-xs">{action}</div>}
    </div>
  );
}
