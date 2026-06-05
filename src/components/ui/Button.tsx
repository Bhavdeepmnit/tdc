import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@utils/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  /** Stretch to fill the container width (used for mobile sticky CTAs). */
  fullWidth?: boolean;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-600 text-text-inverse hover:bg-brand-500 focus-visible:ring-brand-600 shadow-sm',
  secondary:
    'bg-transparent border border-brand-600 text-brand-600 hover:bg-brand-50 focus-visible:ring-brand-600',
  ghost: 'bg-transparent text-text-secondary hover:bg-surface-sidebar focus-visible:ring-brand-300',
  danger:
    'bg-status-error-base text-text-inverse hover:opacity-90 focus-visible:ring-status-error-base',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-body-sm gap-1.5',
  md: 'h-11 px-4 text-body gap-2',
  lg: 'h-12 px-5 text-body-lg gap-2',
};

/**
 * Primary action button per the design system.
 * Supports loading (shows spinner, disables), icons, and a full-width variant.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    disabled,
    className,
    children,
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium',
        'transition-colors duration-fast ease-app',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-bg',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
});
