import type { HTMLAttributes } from 'react';
import { cn } from '@utils/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds a hover shadow lift — use for clickable cards. */
  interactive?: boolean;
}

/** Surface container with the design system's card shadow + rounded corners. */
export function Card({ interactive, className, children, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-surface-divider bg-surface-card p-xs shadow-card',
        interactive &&
          'cursor-pointer transition-shadow duration-fast ease-app hover:shadow-float',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
