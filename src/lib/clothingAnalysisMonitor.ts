import { ClothingAnalysisService } from './clothingAnalysisService';

export interface AnalysisMetrics {
  totalAnalyses: number;
  successRate: number;
  averageConfidence: number;
  categoryDistribution: Record<string, number>;
  averageProcessingTime: number;
  cacheHitRate: number;
}

class ClothingAnalysisMonitor {
  private metrics: AnalysisMetrics = {
    totalAnalyses: 0,
    successRate: 0,
    averageConfidence: 0,
    categoryDistribution: {},
    averageProcessingTime: 0,
    cacheHitRate: 0
  };

  private analysisHistory: Array<{
    timestamp: number;
    category: string;
    confidence: number;
    processingTime: number;
    success: boolean;
  }> = [];

  recordAnalysis(result: {
    category: string;
    confidence: number;
    processingTime: number;
    success: boolean;
  }): void {
    this.analysisHistory.push({
      timestamp: Date.now(),
      ...result
    });

    // Keep only last 1000 analyses for memory efficiency
    if (this.analysisHistory.length > 1000) {
      this.analysisHistory = this.analysisHistory.slice(-1000);
    }

    this.updateMetrics();
  }

  private updateMetrics(): void {
    if (this.analysisHistory.length === 0) return;

    const successful = this.analysisHistory.filter(a => a.success);
    
    this.metrics = {
      totalAnalyses: this.analysisHistory.length,
      successRate: successful.length / this.analysisHistory.length,
      averageConfidence: successful.reduce((sum, a) => sum + a.confidence, 0) / successful.length,
      categoryDistribution: this.getCategoryDistribution(),
      averageProcessingTime: this.analysisHistory.reduce((sum, a) => sum + a.processingTime, 0) / this.analysisHistory.length,
      cacheHitRate: ClothingAnalysisService.getCacheStats().hitRate
    };
  }

  private getCategoryDistribution(): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    this.analysisHistory.forEach(analysis => {
      distribution[analysis.category] = (distribution[analysis.category] || 0) + 1;
    });

    return distribution;
  }

  getMetrics(): AnalysisMetrics {
    return { ...this.metrics };
  }

  getRecentPerformance(minutes: number = 60): {
    analysesInPeriod: number;
    averageConfidence: number;
    successRate: number;
  } {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    const recent = this.analysisHistory.filter(a => a.timestamp > cutoff);
    const successful = recent.filter(a => a.success);

    return {
      analysesInPeriod: recent.length,
      averageConfidence: successful.length > 0 
        ? successful.reduce((sum, a) => sum + a.confidence, 0) / successful.length 
        : 0,
      successRate: recent.length > 0 ? successful.length / recent.length : 0
    };
  }

  // Performance optimization recommendations
  getOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    const stats = this.getMetrics();

    if (stats.cacheHitRate < 0.7) {
      recommendations.push('Consider increasing cache size for better performance');
    }

    if (stats.averageProcessingTime > 5000) {
      recommendations.push('Analysis taking longer than expected - check network connectivity');
    }

    if (stats.successRate < 0.8) {
      recommendations.push('High failure rate detected - review image quality requirements');
    }

    if (stats.averageConfidence < 0.6) {
      recommendations.push('Low confidence scores - consider improving training data or analysis algorithms');
    }

    return recommendations;
  }

  // Clear old data for memory management
  cleanup(): void {
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    this.analysisHistory = this.analysisHistory.filter(a => a.timestamp > oneWeekAgo);
    this.updateMetrics();
  }
}

export const clothingAnalysisMonitor = new ClothingAnalysisMonitor();

// Auto cleanup every hour
setInterval(() => {
  clothingAnalysisMonitor.cleanup();
}, 60 * 60 * 1000);
