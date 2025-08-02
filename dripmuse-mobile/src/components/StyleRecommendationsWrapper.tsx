import React, { Component, ReactNode } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import { getErrorMessage, logError } from "@/lib/errorUtils";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class StyleRecommendationsErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('StyleRecommendations Error Boundary caught an error:', error, errorInfo);
    logError(error, 'StyleRecommendations component error', { errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error ? getErrorMessage(this.state.error) : 'An unexpected error occurred';
      
      return (
        <div className="min-h-screen bg-gradient-hero">
          <div className="container mx-auto px-4 py-16">
            <Card className="max-w-lg mx-auto text-center">
              <CardContent className="p-12">
                <div className="w-20 h-20 mx-auto mb-8 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-10 w-10 text-red-600" />
                </div>
                <h3 className="text-3xl font-heading mb-4 text-foreground">
                  Style Assistant Error
                </h3>
                <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
                  There was an issue loading the style recommendations. This might be due to a network problem or a temporary issue.
                </p>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6 text-left">
                  <p className="text-sm text-muted-foreground font-mono">
                    {errorMessage}
                  </p>
                </div>
                <div className="space-y-3">
                  <Button
                    onClick={this.handleRetry}
                    size="lg"
                    className="w-full"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    size="lg"
                    className="w-full"
                  >
                    Reload Page
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Re-export the original component with error boundary
export { StyleRecommendationsErrorBoundary };
export default StyleRecommendationsErrorBoundary;
