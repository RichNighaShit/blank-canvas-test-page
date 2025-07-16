
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Sparkles } from 'lucide-react';

interface AdvancedVirtualTryOnProps {
  userImg?: string;
  clothingImg?: string;
  clothingType?: 'top' | 'bottom' | 'dress' | 'outerwear' | 'auto';
  onImageUpload?: (type: 'user' | 'clothing', imageUrl: string) => void;
}

const AdvancedVirtualTryOn: React.FC<AdvancedVirtualTryOnProps> = () => {
  const handleTryOnClick = () => {
    window.open('https://huggingface.co/spaces/Kwai-Kolors/Kolors-Virtual-Try-On', '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Advanced Virtual Try-On
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            Experience the power of AI-driven virtual try-on technology
          </p>
          <Button onClick={handleTryOnClick} size="lg">
            <ExternalLink className="h-4 w-4 mr-2" />
            Launch Virtual Try-On
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdvancedVirtualTryOn;
