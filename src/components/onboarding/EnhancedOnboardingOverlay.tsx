import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useOnboarding } from './OnboardingProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  X, 
  ArrowRight, 
  ArrowLeft, 
  SkipForward, 
  PlayCircle,
  PauseCircle,
  RotateCcw,
  Sparkles,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';

interface TooltipPosition {
  top?: number | string;
  left?: number | string;
  right?: number;
  bottom?: number;
  transform?: string;
}

export const EnhancedOnboardingOverlay: React.FC = () => {
  const {
    isActive,
    currentStep,
    currentStepIndex,
    totalSteps,
    nextStep,
    previousStep,
    skipOnboarding,
    completeOnboarding
  } = useOnboarding();

  const location = useLocation();
  const navigate = useNavigate();
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>({});
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({});
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showMiniProgress, setShowMiniProgress] = useState(false);

  // Auto-advance timer
  const [autoAdvanceTimer, setAutoAdvanceTimer] = useState<NodeJS.Timeout | null>(null);

  // Update tooltip position when step changes or page changes
  useEffect(() => {
    if (!isActive || !currentStep || isPaused) return;

    setIsAnimating(true);
    
    // Check if we need to navigate to a different page
    if (currentStep.page && location.pathname !== currentStep.page) {
      navigate(currentStep.page);
      return;
    }

    const updatePosition = () => {
      if (currentStep.targetSelector) {
        const targetElement = document.querySelector(currentStep.targetSelector);
        if (targetElement) {
          const rect = targetElement.getBoundingClientRect();
          const tooltipWidth = 400;
          const tooltipHeight = 250;
          
          // Enhanced highlight effect with animation
          setHighlightStyle({
            position: 'fixed',
            top: rect.top - 12,
            left: rect.left - 12,
            width: rect.width + 24,
            height: rect.height + 24,
            border: '3px solid transparent',
            background: 'linear-gradient(45deg, #8b5cf6, #ec4899, #8b5cf6) border-box',
            borderRadius: '16px',
            boxShadow: `
              0 0 0 4px rgba(139, 92, 246, 0.2),
              0 0 30px rgba(139, 92, 246, 0.4),
              inset 0 0 0 3px rgba(255, 255, 255, 0.8)
            `,
            zIndex: 51,
            pointerEvents: 'none',
            animation: 'tutorialPulse 2s ease-in-out infinite, tutorialGlow 3s ease-in-out infinite alternate',
            transition: 'all 0.3s ease-in-out'
          });

          // Smart tooltip positioning
          const newPosition: TooltipPosition = {};
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          
          switch (currentStep.position) {
            case 'top':
              newPosition.bottom = viewportHeight - rect.top + 20;
              newPosition.left = Math.max(20, Math.min(rect.left + rect.width/2 - tooltipWidth/2, viewportWidth - tooltipWidth - 20));
              break;
            case 'bottom':
              newPosition.top = rect.bottom + 20;
              newPosition.left = Math.max(20, Math.min(rect.left + rect.width/2 - tooltipWidth/2, viewportWidth - tooltipWidth - 20));
              break;
            case 'left':
              newPosition.right = viewportWidth - rect.left + 20;
              newPosition.top = Math.max(20, Math.min(rect.top + rect.height/2 - tooltipHeight/2, viewportHeight - tooltipHeight - 20));
              break;
            case 'right':
              newPosition.left = rect.right + 20;
              newPosition.top = Math.max(20, Math.min(rect.top + rect.height/2 - tooltipHeight/2, viewportHeight - tooltipHeight - 20));
              break;
            default:
              // Auto-position based on available space
              const spaceBelow = viewportHeight - rect.bottom;
              const spaceAbove = rect.top;
              
              if (spaceBelow > tooltipHeight + 40) {
                newPosition.top = rect.bottom + 20;
              } else if (spaceAbove > tooltipHeight + 40) {
                newPosition.bottom = viewportHeight - rect.top + 20;
              } else {
                newPosition.top = '50%';
                newPosition.transform = 'translateY(-50%)';
              }
              newPosition.left = Math.max(20, Math.min(rect.left + rect.width/2 - tooltipWidth/2, viewportWidth - tooltipWidth - 20));
          }
          
          setTooltipPosition(newPosition);
        }
      } else {
        // Center the tooltip
        setTooltipPosition({
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        });
        setHighlightStyle({});
      }
      setIsAnimating(false);
    };

    const timer = setTimeout(updatePosition, 150);
    
    // Set up auto-advance timer (8 seconds)
    if (!currentStep.targetSelector) {
      const autoTimer = setTimeout(() => {
        if (!isPaused) {
          handleNext();
        }
      }, 8000);
      setAutoAdvanceTimer(autoTimer);
    }
    
    window.addEventListener('resize', updatePosition);
    
    return () => {
      clearTimeout(timer);
      if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer);
      window.removeEventListener('resize', updatePosition);
    };
  }, [currentStep, location.pathname, isActive, navigate, isPaused]);

  // Show mini progress indicator
  useEffect(() => {
    setShowMiniProgress(currentStepIndex > 0);
  }, [currentStepIndex]);

  const handleNext = () => {
    if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer);
    
    if (currentStep?.action) {
      currentStep.action();
    }
    
    if (currentStepIndex === totalSteps - 1) {
      completeOnboarding();
    } else {
      nextStep();
    }
  };

  const handlePrevious = () => {
    if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer);
    previousStep();
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
    if (autoAdvanceTimer) {
      clearTimeout(autoAdvanceTimer);
      setAutoAdvanceTimer(null);
    }
  };

  const handleRestart = () => {
    if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer);
    // Reset to first step would require additional provider method
    setIsPaused(false);
  };

  const isLastStep = currentStepIndex === totalSteps - 1;
  const isFirstStep = currentStepIndex === 0;
  const progressPercentage = ((currentStepIndex + 1) / totalSteps) * 100;

  if (!isActive || !currentStep) return null;

  return (
    <>
      {/* Enhanced Backdrop with gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-sm z-[50]" />
      
      {/* Highlight */}
      {currentStep.targetSelector && (
        <div style={highlightStyle} />
      )}
      
      {/* Mini Progress Indicator (when not on center) */}
      {showMiniProgress && currentStep.targetSelector && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[52]">
          <div className="bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border">
            <div className="flex items-center gap-3">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">
                Step {currentStepIndex + 1} of {totalSteps}
              </span>
              <Progress value={progressPercentage} className="w-16 h-2" />
            </div>
          </div>
        </div>
      )}
      
      {/* Enhanced Tooltip */}
      <div
        className={`fixed z-[53] max-w-md transition-all duration-300 ${
          isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}
        style={{
          ...tooltipPosition,
        }}
      >
        <Card className="shadow-2xl border-0 bg-white/98 backdrop-blur-md overflow-hidden">
          {/* Header with gradient */}
          <CardHeader className="pb-3 bg-gradient-to-r from-purple-50 to-pink-50 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border-0">
                  <Sparkles className="mr-1 h-3 w-3" />
                  Step {currentStepIndex + 1} of {totalSteps}
                </Badge>
                {!currentStep.targetSelector && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handlePause}
                      className="h-6 w-6 p-0"
                    >
                      {isPaused ? (
                        <PlayCircle className="h-4 w-4" />
                      ) : (
                        <PauseCircle className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={skipOnboarding}
                className="h-8 w-8 p-0 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              {currentStep.title}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4 p-6">
            <p className="text-gray-600 leading-relaxed">
              {currentStep.description}
            </p>
            
            {/* Enhanced Progress Bar */}
            <div className="space-y-2">
              <Progress 
                value={progressPercentage} 
                className="h-2 bg-gray-100"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Progress</span>
                <span>{Math.round(progressPercentage)}% Complete</span>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-2">
                {!isFirstStep && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevious}
                    className="text-gray-600"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={skipOnboarding}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <SkipForward className="h-4 w-4 mr-1" />
                  Skip
                </Button>
              </div>
              
              <Button
                onClick={handleNext}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
              >
                {isLastStep ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete Tutorial
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
            
            {/* Auto-advance indicator */}
            {!currentStep.targetSelector && !isPaused && (
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500 pt-2 border-t">
                <Clock className="h-3 w-3" />
                <span>Auto-advancing in 8 seconds</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePause}
                  className="h-5 w-5 p-0 ml-1"
                >
                  <PauseCircle className="h-3 w-3" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Animation Styles */}
      <style jsx>{`
        @keyframes tutorialPulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.02);
          }
        }
        
        @keyframes tutorialGlow {
          0% {
            box-shadow: 
              0 0 0 4px rgba(139, 92, 246, 0.2),
              0 0 30px rgba(139, 92, 246, 0.4),
              inset 0 0 0 3px rgba(255, 255, 255, 0.8);
          }
          100% {
            box-shadow: 
              0 0 0 4px rgba(236, 72, 153, 0.2),
              0 0 30px rgba(236, 72, 153, 0.4),
              inset 0 0 0 3px rgba(255, 255, 255, 0.8);
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
};

export default EnhancedOnboardingOverlay;
