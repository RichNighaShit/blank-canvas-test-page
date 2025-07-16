import React, { useState, useEffect, useCallback } from "react";
import { offlineManager } from "@/lib/offlineManager";
import { useErrorHandler } from "@/hooks/useErrorHandler";

interface OfflineState {
  isOnline: boolean;
  pendingActions: number;
  isSyncInProgress: boolean;
  storageStats: {
    totalItems: number;
    storageSize: number;
    lastSync: number;
  };
}

interface OfflineActions {
  queueAction: (type: string, data: any, maxRetries?: number) => Promise<void>;
  clearOfflineData: () => Promise<void>;
  getOfflineWardrobeItems: () => Promise<any[]>;
  getOfflineRecommendations: () => Promise<any[]>;
  storeWardrobeItems: (items: any[]) => Promise<void>;
  storeRecommendations: (recommendations: any[]) => Promise<void>;
  cacheAppData: (key: string, data: any, ttl?: number) => Promise<void>;
  getCachedAppData: (key: string) => Promise<any | null>;
  refreshStorageStats: () => Promise<void>;
}

export const useOffline = () => {
  const { logUserAction, handleError } = useErrorHandler();

  const [state, setState] = useState<OfflineState>({
    isOnline: navigator.onLine,
    pendingActions: 0,
    isSyncInProgress: false,
    storageStats: {
      totalItems: 0,
      storageSize: 0,
      lastSync: 0,
    },
  });

  // Update state from offline manager
  const updateState = useCallback(async () => {
    try {
      const stats = await offlineManager.getStorageStats();
      setState((prev) => ({
        ...prev,
        isOnline: offlineManager.isDeviceOnline,
        pendingActions: offlineManager.pendingActions,
        isSyncInProgress: offlineManager.isSyncInProgress,
        storageStats: stats,
      }));
    } catch (error) {
      handleError(error, "Failed to update offline state", {
        context: { hook: "useOffline", action: "updateState" },
      });
    }
  }, [handleError]);

  // Setup event listeners for offline manager events
  useEffect(() => {
    const handleStatusChange = (event: CustomEvent) => {
      const { isOnline, queueLength } = event.detail;
      setState((prev) => ({
        ...prev,
        isOnline,
        pendingActions: queueLength,
      }));

      logUserAction("offline_status_change", { isOnline, queueLength });
    };

    const handleSyncComplete = (event: CustomEvent) => {
      const { syncedCount, remainingQueue } = event.detail;
      setState((prev) => ({
        ...prev,
        pendingActions: remainingQueue,
        isSyncInProgress: false,
      }));

      logUserAction("offline_sync_complete", { syncedCount, remainingQueue });
    };

    // Listen for offline manager events
    window.addEventListener(
      "offline-manager-status",
      handleStatusChange as EventListener,
    );
    window.addEventListener(
      "offline-manager-sync",
      handleSyncComplete as EventListener,
    );

    // Initial state update
    updateState();

    // Periodic state updates
    const interval = setInterval(updateState, 30000); // Update every 30 seconds

    return () => {
      window.removeEventListener(
        "offline-manager-status",
        handleStatusChange as EventListener,
      );
      window.removeEventListener(
        "offline-manager-sync",
        handleSyncComplete as EventListener,
      );
      clearInterval(interval);
    };
  }, [updateState, logUserAction]);

  // Actions
  const actions: OfflineActions = {
    queueAction: useCallback(
      async (type: string, data: any, maxRetries: number = 3) => {
        try {
          await offlineManager.queueAction({ type, data, maxRetries });
          logUserAction("offline_action_queued", { type });
          updateState();
        } catch (error) {
          handleError(error, `Failed to queue offline action: ${type}`, {
            context: { hook: "useOffline", action: "queueAction" },
          });
        }
      },
      [logUserAction, handleError, updateState],
    ),

    clearOfflineData: useCallback(async () => {
      try {
        await offlineManager.clearOfflineData();
        logUserAction("offline_data_cleared");
        updateState();
      } catch (error) {
        handleError(error, "Failed to clear offline data", {
          context: { hook: "useOffline", action: "clearOfflineData" },
        });
      }
    }, [logUserAction, handleError, updateState]),

    getOfflineWardrobeItems: useCallback(async () => {
      try {
        const items = await offlineManager.getOfflineWardrobeItems();
        logUserAction("offline_wardrobe_items_retrieved", {
          count: items.length,
        });
        return items;
      } catch (error) {
        handleError(error, "Failed to get offline wardrobe items", {
          context: { hook: "useOffline", action: "getOfflineWardrobeItems" },
        });
        return [];
      }
    }, [logUserAction, handleError]),

    getOfflineRecommendations: useCallback(async () => {
      try {
        const recommendations =
          await offlineManager.getOfflineRecommendations();
        logUserAction("offline_recommendations_retrieved", {
          count: recommendations.length,
        });
        return recommendations;
      } catch (error) {
        handleError(error, "Failed to get offline recommendations", {
          context: { hook: "useOffline", action: "getOfflineRecommendations" },
        });
        return [];
      }
    }, [logUserAction, handleError]),

    storeWardrobeItems: useCallback(
      async (items: any[]) => {
        try {
          await offlineManager.storeWardrobeItems(items);
          logUserAction("wardrobe_items_stored_offline", {
            count: items.length,
          });
          updateState();
        } catch (error) {
          handleError(error, "Failed to store wardrobe items offline", {
            context: { hook: "useOffline", action: "storeWardrobeItems" },
          });
        }
      },
      [logUserAction, handleError, updateState],
    ),

    storeRecommendations: useCallback(
      async (recommendations: any[]) => {
        try {
          await offlineManager.storeRecommendations(recommendations);
          logUserAction("recommendations_stored_offline", {
            count: recommendations.length,
          });
          updateState();
        } catch (error) {
          handleError(error, "Failed to store recommendations offline", {
            context: { hook: "useOffline", action: "storeRecommendations" },
          });
        }
      },
      [logUserAction, handleError, updateState],
    ),

    cacheAppData: useCallback(
      async (key: string, data: any, ttl?: number) => {
        try {
          await offlineManager.cacheAppData(key, data, ttl);
          logUserAction("app_data_cached", { key });
        } catch (error) {
          handleError(error, `Failed to cache app data: ${key}`, {
            context: { hook: "useOffline", action: "cacheAppData" },
          });
        }
      },
      [logUserAction, handleError],
    ),

    getCachedAppData: useCallback(
      async (key: string) => {
        try {
          const data = await offlineManager.getCachedAppData(key);
          if (data) {
            logUserAction("app_data_retrieved_from_cache", { key });
          }
          return data;
        } catch (error) {
          handleError(error, `Failed to get cached app data: ${key}`, {
            context: { hook: "useOffline", action: "getCachedAppData" },
          });
          return null;
        }
      },
      [logUserAction, handleError],
    ),

    refreshStorageStats: useCallback(async () => {
      await updateState();
    }, [updateState]),
  };

  return {
    ...state,
    ...actions,
  };
};

export default useOffline;
