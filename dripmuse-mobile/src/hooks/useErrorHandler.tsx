import React, { useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import { logger, LogContext } from "@/lib/logger";

interface ErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  context?: LogContext;
}

/**
 * Custom hook for consistent error handling across the application
 * Provides utilities for logging errors, showing user-friendly messages,
 * and handling different types of errors consistently
 */
export const useErrorHandler = () => {
  /**
   * Handles errors with logging and user feedback
   */
  const handleError = useCallback(
    (
      error: Error | any,
      message?: string,
      options: ErrorHandlerOptions = {},
    ) => {
      const {
        showToast = true,
        logError: shouldLog = true,
        context = {},
      } = options;

      // Determine user-friendly message
      const userMessage = message || getUserFriendlyMessage(error);

      // Log the error
      if (shouldLog) {
        logger.error(userMessage, {
          error,
          context: {
            component: "ErrorHandler",
            action: "handle_error",
            ...context,
          },
        });
      }

      // Show toast notification
      if (showToast) {
        toast({
          title: "Something went wrong",
          description: userMessage,
          variant: "destructive",
        });
      }

      return userMessage;
    },
    [],
  );

  /**
   * Handles API errors specifically
   */
  const handleApiError = useCallback(
    (error: any, endpoint?: string, options: ErrorHandlerOptions = {}) => {
      const apiContext: LogContext = {
        ...options.context,
        action: "api_error",
        metadata: {
          endpoint,
          status: error?.status,
          statusText: error?.statusText,
          ...(options.context?.metadata || {}),
        },
      };

      // Handle specific API error cases
      let message = "An error occurred while processing your request";

      if (error?.status === 401) {
        message = "Please log in to continue";
      } else if (error?.status === 403) {
        message = "You do not have permission to perform this action";
      } else if (error?.status === 404) {
        message = "The requested resource was not found";
      } else if (error?.status === 429) {
        message = "Too many requests. Please try again later";
      } else if (error?.status >= 500) {
        message = "Server error. Please try again later";
      } else if (!navigator.onLine) {
        message = "Please check your internet connection";
      }

      return handleError(error, message, { ...options, context: apiContext });
    },
    [handleError],
  );

  /**
   * Handles async operations with error catching
   */
  const withErrorHandling = useCallback(
    <T,>(
      asyncFn: () => Promise<T>,
      errorMessage?: string,
      options: ErrorHandlerOptions = {},
    ) => {
      return async (): Promise<T | null> => {
        try {
          return await asyncFn();
        } catch (error) {
          handleError(error, errorMessage, options);
          return null;
        }
      };
    },
    [handleError],
  );

  /**
   * Logs user actions for analytics
   */
  const logUserAction = useCallback((action: string, context?: LogContext) => {
    logger.userAction(action, context);
  }, []);

  return {
    handleError,
    handleApiError,
    withErrorHandling,
    logUserAction,
  };
};

/**
 * Converts technical errors to user-friendly messages
 */
function getUserFriendlyMessage(error: any): string {
  // Network errors
  if (error?.code === "NETWORK_ERROR" || !navigator.onLine) {
    return "Please check your internet connection and try again";
  }

  // Timeout errors
  if (error?.code === "TIMEOUT_ERROR" || error?.message?.includes("timeout")) {
    return "The request took too long. Please try again";
  }

  // Validation errors
  if (
    error?.name === "ValidationError" ||
    error?.message?.includes("validation")
  ) {
    return "Please check the information you entered and try again";
  }

  // Authentication errors
  if (error?.message?.includes("auth") || error?.message?.includes("login")) {
    return "Please log in to continue";
  }

  // Permission errors
  if (
    error?.message?.includes("permission") ||
    error?.message?.includes("forbidden")
  ) {
    return "You do not have permission to perform this action";
  }

  // File upload errors
  if (error?.message?.includes("file") || error?.message?.includes("upload")) {
    return "There was a problem uploading your file. Please try again";
  }

  // Supabase specific errors
  if (
    error?.message?.includes("supabase") ||
    error?.code?.startsWith("PGRST")
  ) {
    return "There was a problem connecting to our services. Please try again";
  }

  // Generic fallback
  if (error?.message && error.message.length < 100) {
    // If the error message is short and potentially user-friendly, use it
    return error.message;
  }

  // Default fallback
  return "An unexpected error occurred. Please try again";
}

export default useErrorHandler;
