import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Loader2, RefreshCw, Info } from 'lucide-react';
import { loadFaceApiModels, runModelDiagnostic, getModelStatus, type ModelLoadResult } from '@/lib/modelLoader';

export default function ModelStatusDebug() {
  const [diagnostic, setDiagnostic] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadResult, setLoadResult] = useState<ModelLoadResult | null>(null);

  const runDiagnostic = async () => {
    const result = await runModelDiagnostic();
    setDiagnostic(result);
  };

  const handleManualLoad = async () => {
    setIsLoading(true);
    try {
      const result = await loadFaceApiModels();
      setLoadResult(result);
      // Re-run diagnostic after loading
      await runDiagnostic();
    } catch (error) {
      setLoadResult({
        success: false,
        source: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        loadedModels: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostic();
  }, []);

  const StatusBadge = ({ status, label }: { status: boolean; label: string }) => (
    <div className="flex items-center gap-2">
      {status ? (
        <CheckCircle className="w-4 h-4 text-green-600" />
      ) : (
        <AlertCircle className="w-4 h-4 text-red-600" />
      )}
      <span className={`text-sm ${status ? 'text-green-700' : 'text-red-700'}`}>
        {label}
      </span>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="w-5 h-5" />
          Face Detection Model Status
        </CardTitle>
        <CardDescription>
          Diagnostic information for face-api.js model loading
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        {diagnostic && (
          <div className="space-y-3">
            <h4 className="font-semibold">System Status</h4>
            <div className="grid grid-cols-1 gap-2">
              <StatusBadge status={diagnostic.browserSupport} label="Browser Support" />
              <StatusBadge status={diagnostic.faceApiAvailable} label="Face-API Library" />
              <StatusBadge status={diagnostic.modelsLoaded} label="Models Loaded" />
            </div>

            <h4 className="font-semibold">Individual Models</h4>
            <div className="grid grid-cols-1 gap-2">
              <StatusBadge status={diagnostic.modelStatus.tinyFaceDetector} label="Tiny Face Detector" />
              <StatusBadge status={diagnostic.modelStatus.faceLandmark68Net} label="Face Landmarks" />
            </div>

            {diagnostic.recommendations.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Recommendations</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  {diagnostic.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Load Result */}
        {loadResult && (
          <div className="p-3 rounded-lg bg-gray-50">
            <h4 className="font-semibold mb-2">Last Load Attempt</h4>
            <div className="flex items-center gap-2 mb-2">
              {loadResult.success ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700">Success</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-700">Failed</span>
                </>
              )}
            </div>
            {loadResult.source && (
              <p className="text-sm text-gray-600 mb-1">
                <strong>Source:</strong> {loadResult.source}
              </p>
            )}
            {loadResult.loadedModels.length > 0 && (
              <p className="text-sm text-gray-600 mb-1">
                <strong>Loaded:</strong> {loadResult.loadedModels.join(', ')}
              </p>
            )}
            {loadResult.error && (
              <p className="text-sm text-red-600">
                <strong>Error:</strong> {loadResult.error}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={runDiagnostic}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Status
          </Button>
          
          <Button
            variant="default"
            size="sm"
            onClick={handleManualLoad}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Load Models
          </Button>
        </div>

        {/* Information */}
        <div className="text-xs text-gray-500 border-t pt-3">
          <p><strong>Note:</strong> Face detection enhances color analysis accuracy but is not required. 
          The system will work in fallback mode without face detection models.</p>
        </div>
      </CardContent>
    </Card>
  );
}
