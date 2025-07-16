
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from '@/hooks/useTheme'

// Register service worker for offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('React Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground">Please refresh the page to try again.</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Ensure DOM is ready before rendering
const renderApp = () => {
  try {
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      console.error('Root element not found');
      return;
    }

    // Verify React is properly loaded and dispatcher is available
    if (typeof React === 'undefined' || !React.useState) {
      console.error('React hooks are not available');
      setTimeout(renderApp, 100); // Retry after a short delay
      return;
    }

    const root = ReactDOM.createRoot(rootElement);
    
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <ThemeProvider defaultTheme="default">
            <BrowserRouter>
              <App />
              <Toaster />
            </BrowserRouter>
          </ThemeProvider>
        </ErrorBoundary>
      </React.StrictMode>,
    );
  } catch (error) {
    console.error('Error rendering app:', error);
    // Retry after a short delay if there's an error
    setTimeout(renderApp, 100);
  }
};

// Wait for DOM to be ready and ensure React is fully loaded
const initializeApp = () => {
  // Double-check React availability
  if (typeof React === 'undefined') {
    console.error('React is not loaded, retrying...');
    setTimeout(initializeApp, 50);
    return;
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderApp);
  } else {
    // Add a small delay to ensure all modules are fully initialized
    setTimeout(renderApp, 10);
  }
};

// Initialize the app
initializeApp();
