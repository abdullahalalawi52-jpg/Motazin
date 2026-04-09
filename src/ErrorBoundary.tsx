import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-6">
          <div className="bg-slate-800 p-8 rounded-2xl border border-rose-500/30 max-w-lg w-full shadow-2xl">
            <h1 className="text-2xl font-bold text-rose-400 mb-4">Oops! Something went wrong</h1>
            <p className="text-slate-300 mb-6">
              The application encountered an unexpected error. This usually happens when a resource fails to load or there's a problem with the environment.
            </p>
            <div className="bg-slate-950 p-4 rounded-lg overflow-auto max-h-40 border border-white/10 mb-6">
              <code className="text-rose-300 text-sm">{this.state.error?.toString()}</code>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all"
            >
              Reload Page
            </button>
            <p className="mt-4 text-xs text-slate-500 text-center">
              If the problem persists, please check your Firebase settings or clear your browser cache.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
