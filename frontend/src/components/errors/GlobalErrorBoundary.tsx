/**
 * Global Error Boundary Component
 * Catches React errors and provides recovery mechanisms
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { apiService } from '@/lib/api/apiService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  componentName: string | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      componentName: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Extract component name from error stack
    const componentMatch = errorInfo.componentStack.match(/^\s*at\s+(\w+)/);
    const componentName = componentMatch ? componentMatch[1] : 'Unknown';

    this.setState({
      errorInfo,
      componentName,
    });

    // Log error to backend
    this.logError(error, errorInfo, componentName);
  }

  logError = async (error: Error, errorInfo: ErrorInfo, componentName: string) => {
    try {
      await apiService.post('/errors/log', {
        error: error.toString(),
        errorInfo: errorInfo.componentStack,
        componentName,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        userId: localStorage.getItem('userId'),
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  };

  recover = async () => {
    try {
      // Attempt recovery
      await apiService.post('/system/recover', {
        component: this.state.componentName,
      });

      // Clear error state
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        componentName: null,
      });
    } catch (recoveryError) {
      // If recovery fails, reload app
      console.error('Recovery failed:', recoveryError);
      window.location.reload();
    }
  };

  reportError = () => {
    const { error, errorInfo, componentName } = this.state;
    const errorReport = {
      error: error?.toString(),
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      componentName,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    };

    // Copy to clipboard
    navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2));
    alert('Error report copied to clipboard. Please send it to support.');
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-6 w-6 text-destructive" />
                <CardTitle>Something went wrong</CardTitle>
              </div>
              <CardDescription>
                An unexpected error occurred. We're sorry for the inconvenience.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.state.error && (
                <div className="p-4 bg-destructive/10 rounded-lg">
                  <p className="text-sm font-mono text-destructive">
                    {this.state.error.toString()}
                  </p>
                  {process.env.NODE_ENV === 'development' && this.state.error.stack && (
                    <details className="mt-2">
                      <summary className="text-xs cursor-pointer text-muted-foreground">
                        Stack Trace
                      </summary>
                      <pre className="mt-2 text-xs overflow-auto max-h-40">
                        {this.state.error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {this.state.componentName && (
                <div className="text-sm text-muted-foreground">
                  <p>
                    Component: <span className="font-mono">{this.state.componentName}</span>
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={this.recover} className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button onClick={() => (window.location.href = '/')} variant="outline">
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
                <Button onClick={this.reportError} variant="outline">
                  <Bug className="h-4 w-4 mr-2" />
                  Report
                </Button>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="mt-4">
                  <summary className="text-xs cursor-pointer text-muted-foreground">
                    Component Stack
                  </summary>
                  <pre className="mt-2 text-xs overflow-auto max-h-40 bg-muted p-2 rounded">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
