import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from './ui';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Check if it's a context error
      const isContextError = this.state.error?.message?.includes('useContext') || 
                            this.state.error?.message?.includes('must be used within');

      return (
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="text-center p-8 max-w-lg">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {isContextError ? 'Context Error' : 'Something went wrong'}
            </h2>
            <div className="text-sm text-gray-600 mb-6">
              {isContextError ? (
                <div>
                  <p className="mb-2">A component is trying to access data that isn't available.</p>
                  <p className="mb-2">This usually happens when a component is not properly wrapped with its required provider.</p>
                </div>
              ) : (
                <p className="mb-2">An error occurred while rendering this component.</p>
              )}
              {this.state.error && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                    Show error details
                  </summary>
                  <pre className="text-left bg-gray-50 p-4 rounded-md overflow-auto text-xs mt-2">
                    {this.state.error.toString()}
                  </pre>
                </details>
              )}
            </div>
            <div className="space-x-4">
              <Button onClick={this.handleRetry}>
                Try Again
              </Button>
              <Button
                variant="ghost"
                onClick={() => window.location.reload()}
              >
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
