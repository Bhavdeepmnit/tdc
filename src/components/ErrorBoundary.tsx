import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

/**
 * Top-level error boundary. Without this, any render-time throw unmounts the
 * tree to a blank white screen. Here we catch it and show a friendly recovery
 * card with a reload button (and log the error for debugging).
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error('Unhandled UI error:', error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-surface-bg px-6 text-center">
          <h1 className="font-display text-h3 font-semibold text-text-primary">
            Something went wrong
          </h1>
          <p className="max-w-sm text-body-sm text-text-secondary">
            The screen hit an unexpected error. Reloading usually fixes it.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-2 rounded-lg bg-brand-600 px-4 py-2 text-body-sm font-medium text-text-inverse hover:bg-brand-500"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
