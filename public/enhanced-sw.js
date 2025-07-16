const CACHE_NAME = "dripmuse-v2";
const STATIC_CACHE = "dripmuse-static-v2";
const API_CACHE = "dripmuse-api-v2";
const IMAGE_CACHE = "dripmuse-images-v2";
const WARDROBE_CACHE = "dripmuse-wardrobe-v2";
const RECOMMENDATIONS_CACHE = "dripmuse-recommendations-v2";

// Cache management configuration
const CACHE_CONFIG = {
  static: {
    maxEntries: 100,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  },
  api: {
    maxEntries: 50,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
  images: {
    maxEntries: 200,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
  wardrobe: {
    maxEntries: 500,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
  recommendations: {
    maxEntries: 100,
    maxAge: 2 * 60 * 60 * 1000, // 2 hours
  },
};

// Files to cache immediately for offline functionality
const STATIC_FILES = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.ico",
  "/placeholder.svg",
  "/pwa-192x192.png",
  "/pwa-512x512.png",
];

// Critical app routes to cache for offline navigation
const APP_ROUTES = [
  "/",
  "/dashboard",
  "/wardrobe",
  "/recommendations",
  "/auth",
  "/profile",
];

// Install event - set up caches and preload critical resources
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker...");

  event.waitUntil(
    Promise.all([
      // Cache static files
      caches.open(STATIC_CACHE).then((cache) => {
        console.log("[SW] Caching static files");
        return cache.addAll(STATIC_FILES);
      }),

      // Preload critical app routes
      caches.open(STATIC_CACHE).then((cache) => {
        console.log("[SW] Preloading app routes");
        return Promise.all(
          APP_ROUTES.map((route) =>
            fetch(route)
              .then((response) => {
                if (response.ok) {
                  return cache.put(route, response);
                }
              })
              .catch(() => {
                // Silently fail for preloading
                console.log(`[SW] Failed to preload ${route}`);
              }),
          ),
        );
      }),
    ]).then(() => {
      console.log("[SW] Installation completed");
      // Force activation of new service worker
      return self.skipWaiting();
    }),
  );
});

// Activate event - clean up old caches and claim clients
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker...");

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            const validCaches = [
              STATIC_CACHE,
              API_CACHE,
              IMAGE_CACHE,
              WARDROBE_CACHE,
              RECOMMENDATIONS_CACHE,
            ];

            if (!validCaches.includes(cacheName)) {
              console.log(`[SW] Deleting old cache: ${cacheName}`);
              return caches.delete(cacheName);
            }
          }),
        );
      }),

      // Claim all clients immediately
      self.clients.claim(),
    ]).then(() => {
      console.log("[SW] Activation completed");
    }),
  );
});

// Fetch event - intelligent caching and offline strategies
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Handle different types of requests
  if (isSupabaseApiRequest(url)) {
    event.respondWith(handleSupabaseApiRequest(request));
  } else if (isWardrobeImageRequest(url)) {
    event.respondWith(handleWardrobeImageRequest(request));
  } else if (isWeatherApiRequest(url)) {
    event.respondWith(handleWeatherApiRequest(request));
  } else if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request));
  } else if (isNavigationRequest(request)) {
    event.respondWith(handleNavigationRequest(request));
  } else if (isStaticAssetRequest(request)) {
    event.respondWith(handleStaticAssetRequest(request));
  }
});

// Enhanced API request handlers
async function handleSupabaseApiRequest(request) {
  const url = new URL(request.url);

  // Determine cache strategy based on endpoint
  if (isUserDataRequest(url)) {
    return handleWithNetworkFirst(request, API_CACHE);
  } else if (isWardrobeDataRequest(url)) {
    return handleWithCacheFirst(request, WARDROBE_CACHE);
  } else if (isRecommendationRequest(url)) {
    return handleWithNetworkFirst(request, RECOMMENDATIONS_CACHE);
  }

  // Default to network first for other API requests
  return handleWithNetworkFirst(request, API_CACHE);
}

async function handleWardrobeImageRequest(request) {
  return handleWithCacheFirst(request, IMAGE_CACHE);
}

async function handleWeatherApiRequest(request) {
  // Weather data should be fresh but cached as fallback
  return handleWithNetworkFirst(request, API_CACHE, 15 * 60 * 1000); // 15 minutes
}

async function handleImageRequest(request) {
  return handleWithCacheFirst(request, IMAGE_CACHE);
}

async function handleNavigationRequest(request) {
  try {
    // Try network first for navigation
    const response = await fetch(request);

    if (response.ok) {
      // Cache successful navigation responses
      const cache = await caches.open(STATIC_CACHE);
      const responseToCache = response.clone();
      await cache.put(request, responseToCache);
    }

    return response;
  } catch (error) {
    // Fallback to cached version or index.html for SPA routing
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Return index.html for SPA routing when offline
    const indexResponse = await cache.match("/index.html");
    if (indexResponse) {
      return indexResponse;
    }

    // Last resort: return offline page
    return createOfflinePage();
  }
}

async function handleStaticAssetRequest(request) {
  return handleWithCacheFirst(request, STATIC_CACHE);
}

// Cache strategy implementations
async function handleWithCacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse && !isExpired(cachedResponse, cacheName)) {
    // Update cache in background
    updateCacheInBackground(request, cache);
    return cachedResponse;
  }

  try {
    const response = await fetch(request);

    if (response.ok) {
      const responseToCache = response.clone();
      await cache.put(request, responseToCache);
      await cleanupCache(cache, cacheName);
    }

    return response;
  } catch (error) {
    // Return cached response even if expired when network fails
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return fallback for images
    if (request.destination === "image") {
      const staticCache = await caches.open(STATIC_CACHE);
      return staticCache.match("/placeholder.svg");
    }

    throw error;
  }
}

async function handleWithNetworkFirst(request, cacheName, maxAge = null) {
  try {
    const response = await fetch(request);

    if (response.ok) {
      const cache = await caches.open(cacheName);
      const responseToCache = response.clone();
      await cache.put(request, responseToCache);
      await cleanupCache(cache, cacheName);
    }

    return response;
  } catch (error) {
    // Fallback to cache
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      // Check if cached response is too old for specific max age
      if (maxAge && isExpired(cachedResponse, null, maxAge)) {
        throw error; // Don't return stale weather data
      }
      return cachedResponse;
    }

    throw error;
  }
}

// Helper functions
function isSupabaseApiRequest(url) {
  return (
    url.hostname.includes("supabase.co") && url.pathname.includes("/rest/")
  );
}

function isWardrobeImageRequest(url) {
  return (
    url.hostname.includes("supabase.co") &&
    url.pathname.includes("/storage/") &&
    url.pathname.includes("/wardrobe/")
  );
}

function isWeatherApiRequest(url) {
  return url.hostname.includes("openweathermap.org");
}

function isImageRequest(request) {
  return (
    request.destination === "image" ||
    /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(request.url)
  );
}

function isNavigationRequest(request) {
  return request.mode === "navigate";
}

function isStaticAssetRequest(request) {
  return (
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "font" ||
    /\.(css|js|woff|woff2|ttf)$/i.test(request.url)
  );
}

function isUserDataRequest(url) {
  return url.pathname.includes("/profiles") || url.pathname.includes("/auth/");
}

function isWardrobeDataRequest(url) {
  return url.pathname.includes("/wardrobe_items");
}

function isRecommendationRequest(url) {
  return (
    url.pathname.includes("/recommendations") ||
    url.pathname.includes("/outfits")
  );
}

function isExpired(response, cacheName, customMaxAge = null) {
  const dateHeader = response.headers.get("date");
  if (!dateHeader) return false;

  const responseDate = new Date(dateHeader);
  const now = new Date();
  const age = now.getTime() - responseDate.getTime();

  const maxAge =
    customMaxAge ||
    CACHE_CONFIG[getCacheType(cacheName)]?.maxAge ||
    24 * 60 * 60 * 1000;

  return age > maxAge;
}

function getCacheType(cacheName) {
  if (cacheName.includes("static")) return "static";
  if (cacheName.includes("api")) return "api";
  if (cacheName.includes("image")) return "images";
  if (cacheName.includes("wardrobe")) return "wardrobe";
  if (cacheName.includes("recommendation")) return "recommendations";
  return "api";
}

async function updateCacheInBackground(request, cache) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response);
    }
  } catch (error) {
    // Silently fail background updates
    console.log("[SW] Background cache update failed:", error);
  }
}

async function cleanupCache(cache, cacheName) {
  const cacheType = getCacheType(cacheName);
  const config = CACHE_CONFIG[cacheType];

  if (!config) return;

  const keys = await cache.keys();

  if (keys.length > config.maxEntries) {
    // Remove oldest entries
    const entriesToDelete = keys.length - config.maxEntries;
    const keysToDelete = keys.slice(0, entriesToDelete);

    await Promise.all(keysToDelete.map((key) => cache.delete(key)));
  }
}

function createOfflinePage() {
  const offlineHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>DripMuse - Offline</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body {
          font-family: system-ui, sans-serif;
          margin: 0;
          padding: 2rem;
          text-align: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
        }
        .container {
          max-width: 400px;
          background: rgba(255, 255, 255, 0.1);
          padding: 2rem;
          border-radius: 1rem;
          backdrop-filter: blur(10px);
        }
        h1 { margin-bottom: 1rem; }
        p { margin-bottom: 1.5rem; opacity: 0.9; }
        button {
          background: rgba(255, 255, 255, 0.2);
          border: 2px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          cursor: pointer;
          font-size: 1rem;
        }
        button:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>You're Offline</h1>
        <p>DripMuse is currently unavailable. Your wardrobe and previously viewed recommendations are still accessible.</p>
        <button onclick="window.location.reload()">Try Again</button>
      </div>
    </body>
    </html>
  `;

  return new Response(offlineHtml, {
    headers: { "Content-Type": "text/html" },
  });
}

// Background sync for offline actions
self.addEventListener("sync", (event) => {
  console.log("[SW] Background sync event:", event.tag);

  if (event.tag === "wardrobe-sync") {
    event.waitUntil(syncWardrobeData());
  } else if (event.tag === "recommendations-sync") {
    event.waitUntil(syncRecommendationData());
  } else if (event.tag === "user-actions-sync") {
    event.waitUntil(syncUserActions());
  }
});

async function syncWardrobeData() {
  console.log("[SW] Syncing wardrobe data...");

  try {
    // Get offline wardrobe changes from IndexedDB
    const offlineData = await getOfflineWardrobeData();

    if (offlineData.length > 0) {
      // Sync each change
      for (const change of offlineData) {
        await syncWardrobeChange(change);
      }

      // Clear offline data after successful sync
      await clearOfflineWardrobeData();

      // Notify clients about sync completion
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: "WARDROBE_SYNC_COMPLETE",
            data: { synced: offlineData.length },
          });
        });
      });
    }
  } catch (error) {
    console.error("[SW] Wardrobe sync failed:", error);
  }
}

async function syncRecommendationData() {
  console.log("[SW] Syncing recommendation preferences...");
  // Implementation for syncing recommendation preferences
}

async function syncUserActions() {
  console.log("[SW] Syncing user actions...");
  // Implementation for syncing user actions like likes, saves, etc.
}

// Placeholder functions for IndexedDB operations
async function getOfflineWardrobeData() {
  // Implementation would use IndexedDB to get offline changes
  return [];
}

async function clearOfflineWardrobeData() {
  // Implementation would clear IndexedDB offline data
}

async function syncWardrobeChange(change) {
  // Implementation would sync individual wardrobe changes
}

// Enhanced push notification handling
self.addEventListener("push", (event) => {
  console.log("[SW] Push notification received");

  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || "New style recommendations available!",
    icon: "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
    image: data.image,
    vibrate: [100, 50, 100],
    data: {
      url: data.url || "/",
      timestamp: Date.now(),
      ...data,
    },
    actions: [
      {
        action: "view",
        title: "View Now",
        icon: "/pwa-192x192.png",
      },
      {
        action: "dismiss",
        title: "Dismiss",
        icon: "/pwa-192x192.png",
      },
    ],
    requireInteraction: data.requireInteraction || false,
    silent: false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "DripMuse", options),
  );
});

// Enhanced notification click handling
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked:", event.action);

  event.notification.close();

  if (event.action === "view") {
    const url = event.notification.data?.url || "/";

    event.waitUntil(
      clients.matchAll({ type: "window" }).then((clients) => {
        // Check if app is already open
        const existingClient = clients.find(
          (client) => client.url.includes(url) && "focus" in client,
        );

        if (existingClient) {
          return existingClient.focus();
        }

        // Open new window
        return clients.openWindow(url);
      }),
    );
  }
  // 'dismiss' action just closes the notification (default behavior)
});

// Message handling for communication with main app
self.addEventListener("message", (event) => {
  console.log("[SW] Message received:", event.data);

  if (event.data && event.data.type) {
    switch (event.data.type) {
      case "SKIP_WAITING":
        self.skipWaiting();
        break;

      case "GET_CACHE_SIZE":
        getCacheSize().then((size) => {
          event.ports[0].postMessage({ size });
        });
        break;

      case "CLEAR_CACHE":
        clearAllCaches().then(() => {
          event.ports[0].postMessage({ success: true });
        });
        break;

      case "CACHE_WARDROBE_ITEM":
        cacheWardrobeItem(event.data.item);
        break;
    }
  }
});

async function getCacheSize() {
  const cacheNames = await caches.keys();
  let totalSize = 0;

  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    totalSize += requests.length;
  }

  return totalSize;
}

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
}

async function cacheWardrobeItem(item) {
  if (item.photo_url) {
    const cache = await caches.open(IMAGE_CACHE);
    try {
      const response = await fetch(item.photo_url);
      if (response.ok) {
        await cache.put(item.photo_url, response);
      }
    } catch (error) {
      console.log("[SW] Failed to cache wardrobe item image:", error);
    }
  }
}

console.log("[SW] Enhanced service worker loaded");
