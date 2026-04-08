import React from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl border-4 border-rose-100 p-12 text-center space-y-8">
            <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center text-rose-500 mx-auto">
              <AlertTriangle size={40} />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-3xl font-black text-slate-900">Quest Interrupted!</h1>
              <p className="text-slate-500 font-medium">
                Something unexpected happened on your journey. Don't worry, your progress is safe.
              </p>
              {this.state.error && (
                <div className="p-4 bg-slate-50 rounded-xl text-xs font-mono text-slate-400 break-all">
                  {this.state.error.message}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
              >
                <RefreshCcw size={20} />
                Retry Quest
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full py-4 bg-white text-slate-600 border-2 border-slate-100 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
              >
                <Home size={20} />
                Return to Base
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
