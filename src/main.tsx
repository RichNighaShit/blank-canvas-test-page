import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/hooks/useTheme";
import ErrorBoundary from "@/components/ErrorBoundary";
import { logger } from "@/lib/logger";
import { initializePWAOptimizations } from "@/lib/pwaOptimizations";

// Initialize logger
logger.info("Application starting", {
  component: "App",
  action: "initialization",
  metadata: {
    environment: import.meta.env.MODE,
    timestamp: new Date().toISOString(),
  },
});

// Register service worker for offline support
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        logger.info("Service Worker registered successfully", {
          component: "ServiceWorker",
          action: "registration",
          metadata: { scope: registration.scope },
        });
      })
      .catch((registrationError) => {
        logger.error("Service Worker registration failed", {
          error: registrationError,
          context: {
            component: "ServiceWorker",
            action: "registration",
          },
        });
      });
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
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

// Initialize PWA optimizations
initializePWAOptimizations();
