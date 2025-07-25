import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Palette, 
  Camera, 
  Sparkles, 
  BarChart3, 
  ArrowRight, 
  ArrowLeft, 
  X 
} from 'lucide-react';

interface CleanOnboardingTutorialProps {
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

const tutorialSteps = [
  {
    icon: <Camera className="w-8 h-8" />,
    title: "Build Your Digital Wardrobe",
    description: "Upload photos of your clothes and our AI will automatically categorize them by type, color, and style.",
    action: "Start by clicking 'Wardrobe' in the navigation"
  },
  {
    icon: <Palette className="w-8 h-8" />,
    title: "Discover Your Perfect Colors",
    description: "Take a quick color analysis to find which colors make you look amazing based on your skin tone.",
    action: "Click 'Your Color Palette' to get started"
  },
  {
    icon: <Sparkles className="w-8 h-8" />,
    title: "Get AI Style Recommendations",
    description: "Receive personalized outfit suggestions based on weather, occasion, and your unique style preferences.",
    action: "Visit 'Style Me' for instant outfit ideas"
  },
  {
    icon: <BarChart3 className="w-8 h-8" />,
    title: "Track Your Style Analytics",
    description: "See insights about your wardrobe usage, favorite colors, and style patterns to optimize your closet.",
    action: "Check out 'Analytics' for detailed insights"
  }
];

export const CleanOnboardingTutorial: React.FC<CleanOnboardingTutorialProps> = ({
  isOpen,
  onComplete,
  onSkip
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const progress = ((currentStep + 1) / tutorialSteps.length) * 100;

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = tutorialSteps[currentStep];

  return (
    <Dialog open={isOpen} modal>
      <DialogContent className="max-w-md sm:max-w-lg">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              {step.icon}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{step.title}</h2>
              <p className="text-muted-foreground mt-2">{step.description}</p>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step {currentStep + 1} of {tutorialSteps.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Action Card */}
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-center text-muted-foreground">
                <span className="font-medium">Next:</span> {step.action}
              </p>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <Button
              variant="ghost"
              onClick={onSkip}
              className="text-muted-foreground"
            >
              <X className="w-4 h-4 mr-2" />
              Skip Tour
            </Button>

            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button variant="outline" onClick={handlePrevious}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}
              <Button onClick={handleNext}>
                {currentStep === tutorialSteps.length - 1 ? 'Get Started' : 'Next'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};