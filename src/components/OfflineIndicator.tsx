import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Wifi,
  WifiOff,
  CloudOff,
  Cloud,
  Loader2,
  Database,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { useOffline } from "@/hooks/useOffline";
import { formatDistanceToNow } from "date-fns";

interface OfflineIndicatorProps {
  showDetails?: boolean;
  className?: string;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  showDetails = false,
  className = "",
}) => {
  const {
    isOnline,
    pendingActions,
    isSyncInProgress,
    storageStats,
    clearOfflineData,
    refreshStorageStats,
  } = useOffline();

  const [showDetailedView, setShowDetailedView] = useState(showDetails);
  const [isClearing, setIsClearing] = useState(false);

  const handleClearOfflineData = async () => {
    setIsClearing(true);
    try {
      await clearOfflineData();
    } finally {
      setIsClearing(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getLastSyncText = (): string => {
    if (storageStats.lastSync === 0) return "Never";
    try {
      const syncDate = new Date(storageStats.lastSync);
      if (isNaN(syncDate.getTime())) return "Unknown";
      return formatDistanceToNow(syncDate, { addSuffix: true });
    } catch (error) {
      console.warn("Date formatting error:", error);
      return "Unknown";
    }
  };

  const getStatusColor = (): string => {
    if (!isOnline) return "destructive";
    if (pendingActions > 0) return "secondary";
    return "default";
  };

  const getStatusIcon = () => {
    if (isSyncInProgress) {
      return <Loader2 className="w-3 h-3 animate-spin" />;
    }
    if (!isOnline) {
      return <WifiOff className="w-3 h-3" />;
    }
    if (pendingActions > 0) {
      return <CloudOff className="w-3 h-3" />;
    }
    return <Wifi className="w-3 h-3" />;
  };

  const getStatusText = (): string => {
    if (isSyncInProgress) return "Syncing...";
    if (!isOnline) return "Offline";
    if (pendingActions > 0) return `${pendingActions} pending`;
    return "Online";
  };

  // Simple badge version
  if (!showDetailedView) {
    return (
      <div className={className}>
        <Badge
          variant={getStatusColor() as any}
          className="cursor-pointer transition-all hover:scale-105"
          onClick={() => setShowDetailedView(true)}
        >
          {getStatusIcon()}
          <span className="ml-1 text-xs">{getStatusText()}</span>
        </Badge>
      </div>
    );
  }

  // Detailed card version
  return (
    <div className={`fixed bottom-4 left-4 z-50 max-w-sm ${className}`}>
      <Card className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              {getStatusIcon()}
              Connection Status
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetailedView(false)}
              className="h-6 w-6 p-0"
            >
              ×
            </Button>
          </div>
          <CardDescription className="text-xs">
            {isOnline ? (
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle className="w-3 h-3" />
                Connected to internet
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-600">
                <AlertCircle className="w-3 h-3" />
                Working offline
              </span>
            )}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Sync Status */}
          {(pendingActions > 0 || isSyncInProgress) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span>Sync Progress</span>
                <span>
                  {isSyncInProgress
                    ? "Syncing..."
                    : `${pendingActions} pending`}
                </span>
              </div>
              {isSyncInProgress && (
                <Progress value={undefined} className="h-1" />
              )}
              {pendingActions > 0 && (
                <div className="text-xs text-muted-foreground">
                  Changes will sync when connection is restored
                </div>
              )}
            </div>
          )}

          {/* Storage Stats */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium">
              <Database className="w-3 h-3" />
              Offline Storage
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-muted-foreground">Items</div>
                <div className="font-medium">{storageStats.totalItems}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Size</div>
                <div className="font-medium">
                  {formatBytes(storageStats.storageSize)}
                </div>
              </div>
            </div>

            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Last sync: {getLastSyncText()}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshStorageStats}
              className="flex-1 text-xs h-7"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Refresh
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleClearOfflineData}
              disabled={isClearing || storageStats.totalItems === 0}
              className="flex-1 text-xs h-7"
            >
              {isClearing ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <Trash2 className="w-3 h-3 mr-1" />
              )}
              Clear
            </Button>
          </div>

          {/* Offline Features Info */}
          {!isOnline && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-md p-2">
              <div className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                Available Offline:
              </div>
              <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-0.5">
                <li>• View wardrobe items</li>
                <li>• Browse recommendations</li>
                <li>• Plan outfits</li>
                <li>�� Make changes (sync later)</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OfflineIndicator;
