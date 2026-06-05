import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { cn } from '@utils/cn';

export interface ErrorStateProps {
  title?: string;
  description?: string;
  /** When provided, renders a "Try again" button. */
  onRetry?: () => void;
  retrying?: boolean;
  className?: string;
}

/**
 * Friendly error panel with an optional retry button. Used for network/load
 * failures — never shows raw error text to the user.
 */
export function ErrorState({
  title = 'Something went wrong',
  description = "We couldn't load this right now. Please check your connection and try again.",
  onRetry,
  retrying = false,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn('flex flex-col items-center justify-center px-xs py-lg text-center', className)}
    >
      <div className="mb-xs flex h-16 w-16 items-center justify-center rounded-full bg-status-error-bg">
        <AlertCircle className="h-7 w-7 text-status-error-text" aria-hidden />
      </div>
      <h3 className="text-h4 font-medium text-text-primary">{title}</h3>
      <p className="mt-1 max-w-sm text-body-sm text-text-secondary">{description}</p>
      {onRetry && (
        <Button
          variant="secondary"
          onClick={onRetry}
          isLoading={retrying}
          leftIcon={<RefreshCw className="h-4 w-4" />}
          className="mt-xs"
        >
          Try again
        </Button>
      )}
    </div>
  );
}
