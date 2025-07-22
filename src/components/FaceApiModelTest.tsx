/**
 * Face-API Model Loading Test Component
 * 
 * This component tests the face-api.js model loading functionality
 * and provides debugging information
 */

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { faceApiInitializer, type InitializationResult } from '../lib/faceApiInitializer';
import { enhancedFacialFeatureAnalysis } from '../lib/enhancedFacialFeatureAnalysis';

interface ModelStatus {
  initialized: boolean;
  modelsLoaded: boolean;
  tinyFaceDetector: boolean;
  faceLandmark68Net: boolean;
}

export function FaceApiModelTest() {
  const [status, setStatus] = useState<ModelStatus>({
    initialized: false,
    modelsLoaded: false,
    tinyFaceDetector: false,
    faceLandmark68Net: false
  });
  const [initResult, setInitResult] = useState<InitializationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [testImage, setTestImage] = useState<File | null>(null);
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    updateStatus();
  }, []);

  const updateStatus = () => {
    const currentStatus = faceApiInitializer.getStatus();
    setStatus(currentStatus);
  };

  const testModelLoading = async () => {
    setLoading(true);
    setInitResult(null);
    
    try {
      // Reset to force fresh initialization
      faceApiInitializer.reset();
      
      const result = await faceApiInitializer.initialize();
      setInitResult(result);
      updateStatus();
      
      if (result.success) {
        console.log('✅ Model loading test successful');
      } else {
        console.warn('⚠️ Model loading failed, using fallback mode');
      }
    } catch (error) {
      console.error('❌ Model loading test failed:', error);
      setInitResult({
        success: false,
        source: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        modelsLoaded: [],
        fallbackMode: true
      });
    } finally {
      setLoading(false);
    }
  };

  const testFacialAnalysis = async () => {
    if (!testImage) {
      alert('Please select an image first');
      return;
    }

    setLoading(true);
    setTestResult(null);

    try {
      const result = await enhancedFacialFeatureAnalysis.detectFacialFeatureColors(testImage);
      setTestResult(result);
      console.log('Facial analysis result:', result);
    } catch (error) {
      console.error('Facial analysis test failed:', error);
      setTestResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setTestImage(file);
      setTestResult(null);
    }
  };

  const getStatusBadge = (isLoaded: boolean, label: string) => (
    <Badge variant={isLoaded ? "default" : "destructive"} className="mb-2">
      {label}: {isLoaded ? "✅ Loaded" : "❌ Not Loaded"}
    </Badge>
  );

  return (
    <div className="space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Face-API Model Loading Test</CardTitle>
          <CardDescription>
            Test and debug face-api.js model loading functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {getStatusBadge(status.initialized, "Initialized")}
            {getStatusBadge(status.modelsLoaded, "All Models")}
            {getStatusBadge(status.tinyFaceDetector, "Tiny Face Detector")}
            {getStatusBadge(status.faceLandmark68Net, "Face Landmarks")}
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={testModelLoading} 
              disabled={loading}
              variant={status.modelsLoaded ? "outline" : "default"}
            >
              {loading ? "Testing..." : "Test Model Loading"}
            </Button>
            <Button onClick={updateStatus} variant="outline" size="sm">
              Refresh Status
            </Button>
          </div>

          {initResult && (
            <Alert variant={initResult.success ? "default" : "destructive"}>
              <AlertDescription>
                <div className="space-y-2">
                  <div>
                    <strong>Result:</strong> {initResult.success ? "Success" : "Failed"}
                  </div>
                  {initResult.source && (
                    <div>
                      <strong>Source:</strong> {initResult.source}
                    </div>
                  )}
                  {initResult.error && (
                    <div>
                      <strong>Error:</strong> {initResult.error}
                    </div>
                  )}
                  <div>
                    <strong>Models Loaded:</strong> {initResult.modelsLoaded.join(", ") || "None"}
                  </div>
                  <div>
                    <strong>Fallback Mode:</strong> {initResult.fallbackMode ? "Yes" : "No"}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Facial Analysis Test</CardTitle>
          <CardDescription>
            Test facial feature analysis with an uploaded image
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="image-upload" className="block text-sm font-medium mb-2">
              Upload Test Image:
            </label>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {testImage && (
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Selected: {testImage.name}
              </p>
              <Button 
                onClick={testFacialAnalysis} 
                disabled={loading || !testImage}
              >
                {loading ? "Analyzing..." : "Test Facial Analysis"}
              </Button>
            </div>
          )}

          {testResult && (
            <Alert>
              <AlertDescription>
                <div className="space-y-2">
                  <div>
                    <strong>Analysis Result:</strong>
                  </div>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-64">
                    {JSON.stringify(testResult, null, 2)}
                  </pre>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
