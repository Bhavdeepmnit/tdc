import { useNavigate } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Button } from '@components/ui/Button';

/** 404 fallback for unmatched routes. */
export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-bg px-xs text-center">
      <span className="mb-xs flex h-16 w-16 items-center justify-center rounded-full bg-brand-50">
        <Compass className="h-8 w-8 text-brand-600" aria-hidden="true" />
      </span>
      <p className="font-display text-display font-semibold text-brand-600">404</p>
      <h1 className="mt-2xs font-display text-h2 font-semibold text-text-primary">
        Page not found
      </h1>
      <p className="mt-1 max-w-sm text-body text-text-secondary">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Button className="mt-sm" onClick={() => navigate('/dashboard')}>
        Back to dashboard
      </Button>
    </div>
  );
}
