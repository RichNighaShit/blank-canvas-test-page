/**
 * Offline Manager - Handles offline functionality, data caching, and sync
 * Provides utilities for storing and retrieving data when offline
 */

export interface OfflineAction {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export interface OfflineData {
  wardrobeItems: any[];
  recommendations: any[];
  userProfile: any;
  lastSync: number;
}

export class OfflineManager {
  private dbName = "dripmuse-offline";
  private dbVersion = 1;
  private db: IDBDatabase | null = null;
  private syncQueue: OfflineAction[] = [];
  private isOnline =
    typeof navigator !== "undefined" ? navigator.onLine : false;
  private syncInProgress = false;

  constructor() {
    if (typeof window !== "undefined") {
      this.initializeDB().catch((error) => {
        console.error("[OfflineManager] Failed to initialize:", error);
      });
      this.setupOnlineListeners();
      this.loadSyncQueue();
    }
  }

  /**
   * Initialize IndexedDB for offline storage
   */
  private async initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error("[OfflineManager] Failed to open IndexedDB");
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log("[OfflineManager] IndexedDB initialized");
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains("wardrobeItems")) {
          const wardrobeStore = db.createObjectStore("wardrobeItems", {
            keyPath: "id",
          });
          wardrobeStore.createIndex("category", "category", { unique: false });
          wardrobeStore.createIndex("lastModified", "lastModified", {
            unique: false,
          });
        }

        if (!db.objectStoreNames.contains("recommendations")) {
          const recommendationsStore = db.createObjectStore("recommendations", {
            keyPath: "id",
          });
          recommendationsStore.createIndex("occasion", "occasion", {
            unique: false,
          });
          recommendationsStore.createIndex("timestamp", "timestamp", {
            unique: false,
          });
        }

        if (!db.objectStoreNames.contains("userProfile")) {
          db.createObjectStore("userProfile", { keyPath: "id" });
        }

        if (!db.objectStoreNames.contains("syncQueue")) {
          const syncStore = db.createObjectStore("syncQueue", {
            keyPath: "id",
          });
          syncStore.createIndex("timestamp", "timestamp", { unique: false });
          syncStore.createIndex("type", "type", { unique: false });
        }

        if (!db.objectStoreNames.contains("appCache")) {
          const appCacheStore = db.createObjectStore("appCache", {
            keyPath: "key",
          });
          appCacheStore.createIndex("timestamp", "timestamp", {
            unique: false,
          });
        }

        console.log("[OfflineManager] IndexedDB schema updated");
      };
    });
  }

  /**
   * Setup online/offline event listeners
   */
  private setupOnlineListeners(): void {
    window.addEventListener("online", () => {
      console.log("[OfflineManager] Device went online");
      this.isOnline = true;
      this.processSyncQueue();
      this.notifyOnlineStatus(true);
    });

    window.addEventListener("offline", () => {
      console.log("[OfflineManager] Device went offline");
      this.isOnline = false;
      this.notifyOnlineStatus(false);
    });
  }

  /**
   * Load pending sync actions from IndexedDB
   */
  private async loadSyncQueue(): Promise<void> {
    if (!this.db) return;

    try {
      const transaction = this.db.transaction(["syncQueue"], "readonly");
      const store = transaction.objectStore("syncQueue");
      const request = store.getAll();

      request.onsuccess = () => {
        this.syncQueue = request.result || [];
        console.log(
          `[OfflineManager] Loaded ${this.syncQueue.length} pending sync actions`,
        );

        if (this.isOnline && this.syncQueue.length > 0) {
          this.processSyncQueue();
        }
      };
    } catch (error) {
      console.error("[OfflineManager] Failed to load sync queue:", error);
    }
  }

  /**
   * Store wardrobe items for offline access
   */
  async storeWardrobeItems(items: any[]): Promise<void> {
    if (!this.db) return;

    try {
      const transaction = this.db.transaction(["wardrobeItems"], "readwrite");
      const store = transaction.objectStore("wardrobeItems");

      // Clear existing items
      await new Promise<void>((resolve, reject) => {
        const clearRequest = store.clear();
        clearRequest.onsuccess = () => resolve();
        clearRequest.onerror = () => reject(clearRequest.error);
      });

      // Store new items
      const promises = items.map((item) => {
        return new Promise<void>((resolve, reject) => {
          const addRequest = store.add({
            ...item,
            lastModified: Date.now(),
            offlineAvailable: true,
          });
          addRequest.onsuccess = () => resolve();
          addRequest.onerror = () => reject(addRequest.error);
        });
      });

      await Promise.all(promises);
      console.log(
        `[OfflineManager] Stored ${items.length} wardrobe items offline`,
      );
    } catch (error) {
      console.error("[OfflineManager] Failed to store wardrobe items:", error);
    }
  }

  /**
   * Get wardrobe items from offline storage
   */
  async getOfflineWardrobeItems(): Promise<any[]> {
    if (!this.db) return [];

    try {
      const transaction = this.db.transaction(["wardrobeItems"], "readonly");
      const store = transaction.objectStore("wardrobeItems");

      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => {
          const items = request.result || [];
          console.log(
            `[OfflineManager] Retrieved ${items.length} wardrobe items from offline storage`,
          );
          resolve(items);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(
        "[OfflineManager] Failed to get offline wardrobe items:",
        error,
      );
      return [];
    }
  }

  /**
   * Store recommendations for offline access
   */
  async storeRecommendations(recommendations: any[]): Promise<void> {
    if (!this.db) return;

    try {
      const transaction = this.db.transaction(["recommendations"], "readwrite");
      const store = transaction.objectStore("recommendations");

      // Clear old recommendations (keep only recent ones)
      const cutoffTime = Date.now() - 24 * 60 * 60 * 1000; // 24 hours
      const index = store.index("timestamp");
      const range = IDBKeyRange.upperBound(cutoffTime);

      await new Promise<void>((resolve, reject) => {
        const deleteRequest = index.openCursor(range);
        deleteRequest.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          } else {
            resolve();
          }
        };
        deleteRequest.onerror = () => reject(deleteRequest.error);
      });

      // Store new recommendations
      const promises = recommendations.map((rec) => {
        return new Promise<void>((resolve, reject) => {
          const addRequest = store.put({
            ...rec,
            timestamp: Date.now(),
            offlineAvailable: true,
          });
          addRequest.onsuccess = () => resolve();
          addRequest.onerror = () => reject(addRequest.error);
        });
      });

      await Promise.all(promises);
      console.log(
        `[OfflineManager] Stored ${recommendations.length} recommendations offline`,
      );
    } catch (error) {
      console.error("[OfflineManager] Failed to store recommendations:", error);
    }
  }

  /**
   * Get recommendations from offline storage
   */
  async getOfflineRecommendations(): Promise<any[]> {
    if (!this.db) return [];

    try {
      const transaction = this.db.transaction(["recommendations"], "readonly");
      const store = transaction.objectStore("recommendations");

      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => {
          const recommendations = request.result || [];
          console.log(
            `[OfflineManager] Retrieved ${recommendations.length} recommendations from offline storage`,
          );
          resolve(recommendations);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(
        "[OfflineManager] Failed to get offline recommendations:",
        error,
      );
      return [];
    }
  }

  /**
   * Queue an action for later sync when online
   */
  async queueAction(
    action: Omit<OfflineAction, "id" | "timestamp" | "retryCount">,
  ): Promise<void> {
    const actionWithMeta: OfflineAction = {
      ...action,
      id: `${action.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.syncQueue.push(actionWithMeta);

    // Store in IndexedDB
    if (this.db) {
      try {
        const transaction = this.db.transaction(["syncQueue"], "readwrite");
        const store = transaction.objectStore("syncQueue");
        store.add(actionWithMeta);
        console.log(`[OfflineManager] Queued action: ${action.type}`);
      } catch (error) {
        console.error("[OfflineManager] Failed to store queued action:", error);
      }
    }

    // Try to sync immediately if online
    if (this.isOnline) {
      this.processSyncQueue();
    }
  }

  /**
   * Process the sync queue when online
   */
  private async processSyncQueue(): Promise<void> {
    if (!this.isOnline || this.syncInProgress || this.syncQueue.length === 0) {
      return;
    }

    this.syncInProgress = true;
    console.log(
      `[OfflineManager] Processing ${this.syncQueue.length} queued actions`,
    );

    const actionsToProcess = [...this.syncQueue];
    const completedActions: string[] = [];

    for (const action of actionsToProcess) {
      try {
        const success = await this.executeAction(action);

        if (success) {
          completedActions.push(action.id);
          console.log(
            `[OfflineManager] Successfully synced action: ${action.type}`,
          );
        } else {
          // Increment retry count
          action.retryCount++;

          if (action.retryCount >= action.maxRetries) {
            console.error(
              `[OfflineManager] Action failed permanently: ${action.type}`,
            );
            completedActions.push(action.id); // Remove from queue
          } else {
            console.warn(
              `[OfflineManager] Action failed, will retry: ${action.type} (${action.retryCount}/${action.maxRetries})`,
            );
          }
        }
      } catch (error) {
        console.error(
          `[OfflineManager] Error processing action ${action.type}:`,
          error,
        );
        action.retryCount++;

        if (action.retryCount >= action.maxRetries) {
          completedActions.push(action.id);
        }
      }
    }

    // Remove completed actions from queue
    this.syncQueue = this.syncQueue.filter(
      (action) => !completedActions.includes(action.id),
    );

    // Update IndexedDB
    if (this.db && completedActions.length > 0) {
      try {
        const transaction = this.db.transaction(["syncQueue"], "readwrite");
        const store = transaction.objectStore("syncQueue");

        for (const actionId of completedActions) {
          store.delete(actionId);
        }
      } catch (error) {
        console.error(
          "[OfflineManager] Failed to update sync queue in IndexedDB:",
          error,
        );
      }
    }

    this.syncInProgress = false;

    // Notify app of sync completion
    this.notifySyncComplete(completedActions.length);
  }

  /**
   * Execute a queued action
   */
  private async executeAction(action: OfflineAction): Promise<boolean> {
    switch (action.type) {
      case "ADD_WARDROBE_ITEM":
        return this.syncAddWardrobeItem(action.data);

      case "UPDATE_WARDROBE_ITEM":
        return this.syncUpdateWardrobeItem(action.data);

      case "DELETE_WARDROBE_ITEM":
        return this.syncDeleteWardrobeItem(action.data);

      case "SAVE_OUTFIT":
        return this.syncSaveOutfit(action.data);

      case "UPDATE_PROFILE":
        return this.syncUpdateProfile(action.data);

      default:
        console.warn(`[OfflineManager] Unknown action type: ${action.type}`);
        return false;
    }
  }

  /**
   * Sync actions with the server
   */
  private async syncAddWardrobeItem(data: any): Promise<boolean> {
    try {
      // Implementation would make API call to add wardrobe item
      // const response = await fetch('/api/wardrobe-items', { method: 'POST', body: JSON.stringify(data) });
      // return response.ok;

      // For demo purposes, simulate success
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return Math.random() > 0.1; // 90% success rate
    } catch (error) {
      console.error(
        "[OfflineManager] Failed to sync add wardrobe item:",
        error,
      );
      return false;
    }
  }

  private async syncUpdateWardrobeItem(data: any): Promise<boolean> {
    try {
      // Implementation would make API call to update wardrobe item
      await new Promise((resolve) => setTimeout(resolve, 800));
      return Math.random() > 0.1;
    } catch (error) {
      console.error(
        "[OfflineManager] Failed to sync update wardrobe item:",
        error,
      );
      return false;
    }
  }

  private async syncDeleteWardrobeItem(data: any): Promise<boolean> {
    try {
      // Implementation would make API call to delete wardrobe item
      await new Promise((resolve) => setTimeout(resolve, 500));
      return Math.random() > 0.1;
    } catch (error) {
      console.error(
        "[OfflineManager] Failed to sync delete wardrobe item:",
        error,
      );
      return false;
    }
  }

  private async syncSaveOutfit(data: any): Promise<boolean> {
    try {
      // Implementation would make API call to save outfit
      await new Promise((resolve) => setTimeout(resolve, 600));
      return Math.random() > 0.1;
    } catch (error) {
      console.error("[OfflineManager] Failed to sync save outfit:", error);
      return false;
    }
  }

  private async syncUpdateProfile(data: any): Promise<boolean> {
    try {
      // Implementation would make API call to update profile
      await new Promise((resolve) => setTimeout(resolve, 700));
      return Math.random() > 0.1;
    } catch (error) {
      console.error("[OfflineManager] Failed to sync update profile:", error);
      return false;
    }
  }

  /**
   * Cache app data for offline use
   */
  async cacheAppData(
    key: string,
    data: any,
    ttl: number = 24 * 60 * 60 * 1000,
  ): Promise<void> {
    if (!this.db) return;

    try {
      const transaction = this.db.transaction(["appCache"], "readwrite");
      const store = transaction.objectStore("appCache");

      const cacheItem = {
        key,
        data,
        timestamp: Date.now(),
        ttl,
      };

      store.put(cacheItem);
      console.log(`[OfflineManager] Cached app data: ${key}`);
    } catch (error) {
      console.error("[OfflineManager] Failed to cache app data:", error);
    }
  }

  /**
   * Get cached app data
   */
  async getCachedAppData(key: string): Promise<any | null> {
    if (!this.db) return null;

    try {
      const transaction = this.db.transaction(["appCache"], "readonly");
      const store = transaction.objectStore("appCache");

      return new Promise((resolve, reject) => {
        const request = store.get(key);
        request.onsuccess = () => {
          const result = request.result;

          if (!result) {
            resolve(null);
            return;
          }

          // Check if cached data has expired
          const now = Date.now();
          if (now - result.timestamp > result.ttl) {
            console.log(`[OfflineManager] Cached data expired: ${key}`);
            // Clean up expired data
            store.delete(key);
            resolve(null);
            return;
          }

          console.log(`[OfflineManager] Retrieved cached data: ${key}`);
          resolve(result.data);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error("[OfflineManager] Failed to get cached app data:", error);
      return null;
    }
  }

  /**
   * Clear all offline data
   */
  async clearOfflineData(): Promise<void> {
    if (!this.db) return;

    try {
      const storeNames = [
        "wardrobeItems",
        "recommendations",
        "userProfile",
        "appCache",
      ];
      const transaction = this.db.transaction(storeNames, "readwrite");

      const promises = storeNames.map((storeName) => {
        return new Promise<void>((resolve, reject) => {
          const store = transaction.objectStore(storeName);
          const request = store.clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      });

      await Promise.all(promises);
      console.log("[OfflineManager] Cleared all offline data");
    } catch (error) {
      console.error("[OfflineManager] Failed to clear offline data:", error);
    }
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(): Promise<{
    totalItems: number;
    storageSize: number;
    lastSync: number;
  }> {
    if (!this.db) return { totalItems: 0, storageSize: 0, lastSync: 0 };

    try {
      const transaction = this.db.transaction(
        ["wardrobeItems", "recommendations", "appCache"],
        "readonly",
      );

      const wardrobePromise = new Promise<number>((resolve) => {
        const request = transaction.objectStore("wardrobeItems").count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(0);
      });

      const recommendationsPromise = new Promise<number>((resolve) => {
        const request = transaction.objectStore("recommendations").count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(0);
      });

      const cachePromise = new Promise<number>((resolve) => {
        const request = transaction.objectStore("appCache").count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(0);
      });

      const [wardrobeCount, recommendationsCount, cacheCount] =
        await Promise.all([
          wardrobePromise,
          recommendationsPromise,
          cachePromise,
        ]);

      const totalItems = wardrobeCount + recommendationsCount + cacheCount;

      // Estimate storage size (rough calculation)
      const estimatedSize = totalItems * 5000; // ~5KB per item average

      return {
        totalItems,
        storageSize: estimatedSize,
        lastSync: this.getLastSyncTime(),
      };
    } catch (error) {
      console.error("[OfflineManager] Failed to get storage stats:", error);
      return { totalItems: 0, storageSize: 0, lastSync: 0 };
    }
  }

  /**
   * Notify app components of online status change
   */
  private notifyOnlineStatus(isOnline: boolean): void {
    window.dispatchEvent(
      new CustomEvent("offline-manager-status", {
        detail: { isOnline, queueLength: this.syncQueue.length },
      }),
    );
  }

  /**
   * Notify app components of sync completion
   */
  private notifySyncComplete(syncedCount: number): void {
    window.dispatchEvent(
      new CustomEvent("offline-manager-sync", {
        detail: { syncedCount, remainingQueue: this.syncQueue.length },
      }),
    );
  }

  /**
   * Get last sync time
   */
  private getLastSyncTime(): number {
    return parseInt(localStorage.getItem("dripmuse-last-sync") || "0");
  }

  /**
   * Update last sync time
   */
  private updateLastSyncTime(): void {
    localStorage.setItem("dripmuse-last-sync", Date.now().toString());
  }

  /**
   * Public getters
   */
  get isDeviceOnline(): boolean {
    return this.isOnline;
  }

  get pendingActions(): number {
    return this.syncQueue.length;
  }

  get isSyncInProgress(): boolean {
    return this.syncInProgress;
  }
}

// Create singleton instance
export const offlineManager = new OfflineManager();

// Export types
export default OfflineManager;
