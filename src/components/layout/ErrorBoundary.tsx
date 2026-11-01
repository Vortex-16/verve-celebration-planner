import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          aria-live="assertive"
          className="min-h-screen bg-[#F8F9FA] text-[#18181B] flex items-center justify-center p-6"
        >
          <div className="max-w-md w-full bg-white border border-zinc-200 rounded-2xl shadow-xl p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h1 className="text-base font-bold text-zinc-900 tracking-tight">
              Celebration Workspace Notice
            </h1>
            <p className="text-xs text-zinc-600 leading-relaxed">
              An unexpected condition occurred while rendering this view. Your stored planning data remains safe in local cache and Firestore.
            </p>
            {this.state.error?.message && (
              <div className="text-[11px] font-mono bg-zinc-50 border border-zinc-200 p-2.5 rounded-xl text-zinc-700 text-left overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 transition active:scale-95 cursor-pointer shadow-sm"
            >
              <RotateCcw className="w-4 h-4 text-[#E11D48]" />
              <span>Reload Celebration Workspace</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
