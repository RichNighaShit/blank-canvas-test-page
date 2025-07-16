import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PerformanceMonitor } from '@/lib/performanceMonitor';
import { PerformanceCache } from '@/lib/performanceCache';
import { ImageOptimizer } from '@/lib/imageOptimizer';
import { BarChart3, RefreshCw, Zap, HardDrive, Clock, TrendingUp } from 'lucide-react';

interface PerformanceStats {
  cache: {
    memorySize: number;
    localStorageSize: number;
    namespaces: string[];
  };
  monitor: {
    metrics: Array<{
      name: string;
      value: number;
      unit: string;
      category: string;
    }>;
    summary: {
      totalLoadTime: number;
      firstContentfulPaint: number;
      largestContentfulPaint: number;
      cumulativeLayoutShift: number;
    };
    recommendations: string[];
  };
}

export const PerformanceDashboard: React.FC = () => {
  const [stats, setStats] = React.useState<PerformanceStats | null>(null);
  const [isVisible, setIsVisible] = React.useState(false);

  const updateStats = () => {
    const cacheStats = PerformanceCache.getStats();
    const monitorReport = PerformanceMonitor.getReport();
    
    setStats({
      cache: cacheStats,
      monitor: monitorReport
    });
  };

  React.useEffect(() => {
    updateStats();
    const interval = setInterval(updateStats, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const getPerformanceScore = () => {
    if (!stats) return 0;
    
    const { summary } = stats.monitor;
    let score = 100;
    
    // Deduct points for poor performance
    if (summary.totalLoadTime > 3000) score -= 20;
    if (summary.firstContentfulPaint > 1500) score -= 15;
    if (summary.largestContentfulPaint > 2500) score -= 15;
    if (summary.cumulativeLayoutShift > 0.1) score -= 10;
    
    return Math.max(0, score);
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          size="sm"
          className="bg-purple-600 hover:bg-purple-700"
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Performance
        </Button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Card className="w-80">
          <CardContent className="p-4">
            <div className="flex items-center justify-center">
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              Loading performance data...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const performanceScore = getPerformanceScore();

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 max-h-96 overflow-y-auto">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              Performance Dashboard
            </CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={updateStats}
                size="sm"
                variant="outline"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
              <Button
                onClick={() => setIsVisible(false)}
                size="sm"
                variant="outline"
              >
                ×
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Performance Score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Performance Score</span>
              <Badge className={getPerformanceColor(performanceScore)}>
                {performanceScore}/100
              </Badge>
            </div>
            <Progress value={performanceScore} className="h-2" />
          </div>

          {/* Core Web Vitals */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground">Core Web Vitals</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between">
                <span>Load Time:</span>
                <span className="font-mono">
                  {Math.round(stats.monitor.summary.totalLoadTime)}ms
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>FCP:</span>
                <span className="font-mono">
                  {Math.round(stats.monitor.summary.firstContentfulPaint)}ms
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>LCP:</span>
                <span className="font-mono">
                  {Math.round(stats.monitor.summary.largestContentfulPaint)}ms
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>CLS:</span>
                <span className="font-mono">
                  {stats.monitor.summary.cumulativeLayoutShift.toFixed(3)}
                </span>
              </div>
            </div>
          </div>

          {/* Cache Stats */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground">Cache</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between">
                <span>Memory:</span>
                <span className="font-mono">{stats.cache.memorySize} items</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Storage:</span>
                <span className="font-mono">{Math.round(stats.cache.localStorageSize / 1024)}KB</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {stats.cache.namespaces.map(namespace => (
                <Badge key={namespace} variant="secondary" className="text-xs">
                  {namespace}
                </Badge>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          {stats.monitor.recommendations.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground">Recommendations</h4>
              <div className="space-y-1">
                {stats.monitor.recommendations.slice(0, 2).map((rec, index) => (
                  <div key={index} className="text-xs text-muted-foreground">
                    • {rec}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t">
            <Button
              onClick={() => {
                PerformanceCache.clear();
                updateStats();
              }}
              size="sm"
              variant="outline"
              className="flex-1"
            >
              <HardDrive className="h-3 w-3 mr-1" />
              Clear Cache
            </Button>
            <Button
              onClick={() => {
                PerformanceMonitor.clear();
                updateStats();
              }}
              size="sm"
              variant="outline"
              className="flex-1"
            >
              <Clock className="h-3 w-3 mr-1" />
              Clear Metrics
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
