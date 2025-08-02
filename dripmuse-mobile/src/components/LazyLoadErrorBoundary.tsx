import React, { Component, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { getErrorMessage } from '@/lib/errorUtils';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  retryCount: number;
}

/**
 * Error boundary specifically designed for lazy-loaded components
 * Provides better error messages and retry functionality for dynamic imports
 */
class LazyLoadErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    const errorMessage = getErrorMessage(error);
    const isChunkError = error.message?.includes('Loading chunk') || 
                        error.message?.includes('dynamically imported module') ||
                        error.message?.includes('Failed to fetch dynamically imported module');
    
    console.error(`LazyLoadErrorBoundary caught error in ${this.props.componentName || 'component'}:`, {
      message: errorMessage,
      isChunkError,
      retryCount: this.state.retryCount,
      componentStack: errorInfo.componentStack,
      stack: error.stack
    });

    // Auto-retry for chunk loading errors
    if (isChunkError && this.state.retryCount < this.maxRetries) {
      console.log(`Auto-retrying lazy load (${this.state.retryCount + 1}/${this.maxRetries})`);
      setTimeout(() => {
        this.setState(prevState => ({
          hasError: false,
          error: undefined,
          retryCount: prevState.retryCount + 1
        }));
      }, 1000 * (this.state.retryCount + 1)); // Progressive delay
    }
  }

  handleManualRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
      retryCount: this.state.retryCount + 1
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isChunkError = this.state.error.message?.includes('Loading chunk') || 
                          this.state.error.message?.includes('dynamically imported module') ||
                          this.state.error.message?.includes('Failed to fetch dynamically imported module');

      const canRetry = this.state.retryCount < this.maxRetries;

      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
              <CardTitle>
                {isChunkError ? 'Loading Error' : 'Component Error'}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                {isChunkError 
                  ? 'Failed to load this part of the application. This can happen due to network issues or app updates.'
                  : `Something went wrong while loading ${this.props.componentName || 'this component'}.`
                }
              </p>
              
              {this.state.error && (
                <div className="text-xs text-muted-foreground bg-muted p-2 rounded max-h-20 overflow-y-auto">
                  {getErrorMessage(this.state.error)}
                </div>
              )}

              <div className="flex gap-2 justify-center flex-wrap">
                {canRetry && (
                  <Button onClick={this.handleManualRetry} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                )}
                
                <Button onClick={this.handleReload} size="sm">
                  Reload Page
                </Button>
                
                <Button 
                  onClick={() => window.location.href = '/'} 
                  variant="outline" 
                  size="sm"
                >
                  Go Home
                </Button>
              </div>

              {this.state.retryCount > 0 && (
                <p className="text-xs text-muted-foreground">
                  Retry attempt: {this.state.retryCount}/{this.maxRetries}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default LazyLoadErrorBoundary;
