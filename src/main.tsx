
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

// Ensure DOM is ready before rendering
const renderApp = () => {
  try {
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      console.error('Root element not found');
      return;
    }

    const root = ReactDOM.createRoot(rootElement);
    
    root.render(
      <React.StrictMode>
        <ThemeProvider defaultTheme="default">
          <BrowserRouter>
            <App />
            <Toaster />
          </BrowserRouter>
        </ThemeProvider>
      </React.StrictMode>,
    );
  } catch (error) {
    console.error('Error rendering app:', error);
  }
};

// Wait for DOM to be ready and ensure React is fully loaded
const initializeApp = () => {
  if (typeof React === 'undefined') {
    console.error('React is not loaded');
    return;
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderApp);
  } else {
    renderApp();
  }
};

// Add a small delay to ensure all modules are loaded
setTimeout(initializeApp, 0);
