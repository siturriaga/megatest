'use client';
import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 * and displays a fallback UI instead of crashing the whole app.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      eventId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console in development
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    this.setState({ errorInfo });
    
    // In production, you would send this to an error tracking service
    // Example: Sentry, LogRocket, etc.
    if (process.env.NODE_ENV === 'production') {
      // logErrorToService(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="max-w-md w-full">
            <div className="bg-card border border-border rounded-2xl p-8 text-center shadow-xl">
              {/* Icon */}
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10 text-red-400" />
              </div>
              
              {/* Title */}
              <h1 className="text-2xl font-black text-foreground mb-2">
                Something went wrong
              </h1>
              
              {/* Message */}
              <p className="text-muted-foreground mb-6">
                An unexpected error occurred. Don't worry, your data is safe. 
                Try refreshing the page or going back to the dashboard.
              </p>
              
              {/* Error details (development only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mb-6 text-left">
                  <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                    Error Details (Development Only)
                  </summary>
                  <div className="mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg overflow-auto max-h-40">
                    <pre className="text-xs text-red-400 whitespace-pre-wrap">
                      {this.state.error.toString()}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </div>
                </details>
              )}
              
              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={this.handleReload}
                  className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <RefreshCw size={18} />
                  Refresh Page
                </button>
                
                <button
                  onClick={this.handleGoHome}
                  className="w-full py-3 bg-accent border border-border text-foreground font-medium rounded-xl flex items-center justify-center gap-2 hover:bg-accent/80 transition-colors"
                >
                  <Home size={18} />
                  Go to Dashboard
                </button>
                
                {this.props.onReset && (
                  <button
                    onClick={() => {
                      this.handleReset();
                      this.props.onReset?.();
                    }}
                    className="w-full py-3 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
                  >
                    Try Again
                  </button>
                )}
              </div>
              
              {/* Support info */}
              <p className="mt-6 text-xs text-muted-foreground">
                If this problem persists, please contact your administrator.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Functional wrapper for Error Boundary
 * Allows using hooks in parent components
 */
export function ErrorBoundaryWrapper({ children, fallback, onReset }) {
  return (
    <ErrorBoundary fallback={fallback} onReset={onReset}>
      {children}
    </ErrorBoundary>
  );
}

/**
 * Panel-specific error boundary with smaller UI
 */
export function PanelErrorBoundary({ children, panelName = 'This section' }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="glass-card p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
          <p className="font-bold text-foreground">{panelName} encountered an error</p>
          <p className="text-sm text-muted-foreground mt-1">
            Try refreshing the page
          </p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

export default ErrorBoundary;
