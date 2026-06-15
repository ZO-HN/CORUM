import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  moduleName?: string;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`ErrorBoundary caught an error in module "${this.props.moduleName || 'Unknown'}":`, error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="p-6 bg-surface-container-low border border-outline-variant/10 rounded-2xl flex flex-col items-center justify-center text-center space-y-3 shadow-lg select-none">
          <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-bold text-on-surface">Failed to load {this.props.moduleName || 'module'}</h4>
            <p className="text-xs text-on-surface-variant mt-1">An error occurred while rendering this component.</p>
          </div>
          <button
            onClick={this.handleReset}
            className="px-3.5 py-1.5 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all rounded-lg text-xs font-bold"
          >
            Retry Component
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
export default ErrorBoundary;
