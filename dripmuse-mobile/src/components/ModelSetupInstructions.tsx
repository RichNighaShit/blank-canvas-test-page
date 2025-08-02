import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Download, ExternalLink, Info } from 'lucide-react';

export default function ModelSetupInstructions() {
  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-800">
          <Info className="w-5 h-5" />
          Face Detection Setup
        </CardTitle>
        <CardDescription className="text-amber-700">
          To enable enhanced face detection for more accurate color analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-amber-800">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium mb-2">Face detection models are not available locally</p>
            <p className="text-sm text-amber-700">
              The system will automatically attempt to load models from CDN sources. 
              If this fails, color analysis will work with fallback methods (slightly reduced accuracy).
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold">What you can do:</h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="text-xs bg-white">1</Badge>
              <span>Wait for automatic CDN loading (usually takes 5-10 seconds)</span>
            </div>
            
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="text-xs bg-white">2</Badge>
              <span>Use the "Load Models" button in the debug panel above</span>
            </div>
            
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="text-xs bg-white">3</Badge>
              <span>Continue with analysis - fallback methods work well for most cases</span>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-amber-200">
          <h4 className="font-semibold mb-2">For developers:</h4>
          <p className="text-sm text-amber-700">
            To set up local models, download the face-api.js model files to <code className="bg-amber-100 px-1 rounded">public/models/</code>. 
            See the README in that directory for instructions.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
