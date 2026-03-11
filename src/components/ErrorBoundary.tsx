import * as React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public override render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(215,205,187,0.45),_transparent_45%),linear-gradient(180deg,_#f7f2eb_0%,_#ffffff_100%)] px-6 text-center">
        <div className="w-full max-w-2xl rounded-[2.5rem] border border-white/80 bg-white/80 p-10 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-red-500">
            <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="mt-8 text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">Storefront error</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-zinc-950">The store couldn&apos;t finish loading.</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-zinc-600">
            The page hit an unexpected runtime issue. Reload the storefront to recover, or dismiss this view if you are debugging locally.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              onClick={() => window.location.reload()}
              className="rounded-2xl bg-zinc-950 px-6 py-4 text-sm font-black uppercase tracking-[0.22em] text-white"
            >
              Reload Store
            </button>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="rounded-2xl border border-zinc-200 bg-white px-6 py-4 text-sm font-black uppercase tracking-[0.22em] text-zinc-950"
            >
              Dismiss
            </button>
          </div>
          {this.state.error && (
            <div className="mt-8 overflow-auto rounded-2xl border border-zinc-100 bg-zinc-50 p-4 text-left">
              <code className="text-[10px] text-zinc-500">{this.state.error.stack}</code>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
