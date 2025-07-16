
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ExternalLink, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const VirtualTryOn = () => {
  const navigate = useNavigate();

  const handleTryOnClick = () => {
    window.open('https://huggingface.co/spaces/Kwai-Kolors/Kolors-Virtual-Try-On', '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-hero py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold mb-2">Virtual Try-On</h1>
          <p className="text-muted-foreground">
            Experience AI-powered virtual try-on with Kolors technology
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Kolors Virtual Try-On
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Try on clothing items virtually using advanced AI technology. Upload your photo and see how different outfits look on you!
            </p>
            
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-lg border">
              <h3 className="font-semibold mb-2">Features:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>AI-powered clothing try-on</li>
                <li>Realistic fabric simulation</li>
                <li>Multiple clothing categories</li>
                <li>High-quality results</li>
              </ul>
            </div>

            <Button 
              onClick={handleTryOnClick}
              className="w-full"
              size="lg"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Virtual Try-On
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-sm text-muted-foreground">
              <p>Powered by Kolors Virtual Try-On technology</p>
              <p className="mt-1">Advanced AI for realistic clothing visualization</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VirtualTryOn;
