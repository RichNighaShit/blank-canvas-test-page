import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useOnboarding } from './OnboardingProvider';
import { useOneTimeExperience, EXPERIENCE_IDS } from '@/hooks/useOneTimeExperience';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  X, 
  ArrowRight, 
  ArrowLeft, 
  SkipForward, 
  PlayCircle,
  PauseCircle,
  Sparkles,
  CheckCircle,
  ChevronRight,
  Target,
  Eye,
  Navigation
} from 'lucide-react';

interface SpotlightPosition {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface TooltipPosition {
  top?: number | string;
  left?: number | string;
  right?: number;
  bottom?: number;
  transform?: string;
}

export const ProfessionalTutorialOverlay: React.FC = () => {
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

  const { hasSeenExperience, markExperienceComplete } = useOneTimeExperience();

  const location = useLocation();
  const navigate = useNavigate();
  const [spotlightPosition, setSpotlightPosition] = useState<SpotlightPosition | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>({});
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showPulse, setShowPulse] = useState(false);
  const spotlightRef = useRef<HTMLDivElement>(null);

  // Auto-advance timer
  const [autoAdvanceTimer, setAutoAdvanceTimer] = useState<NodeJS.Timeout | null>(null);

  // Update spotlight and tooltip when step changes
  useEffect(() => {
    if (!isActive || !currentStep || isPaused) return;

    setIsAnimating(true);
    
    // Navigate to the required page if needed
    if (currentStep.page && location.pathname !== currentStep.page) {
      navigate(currentStep.page);
      return;
    }

    const updatePositions = () => {
      if (currentStep.targetSelector) {
        const targetElement = document.querySelector(currentStep.targetSelector);
        if (targetElement) {
          const rect = targetElement.getBoundingClientRect();
          const padding = 12;
          
          // Set spotlight position with padding
          setSpotlightPosition({
            top: rect.top - padding,
            left: rect.left - padding,
            width: rect.width + (padding * 2),
            height: rect.height + (padding * 2)
          });

          // Calculate tooltip position
          const tooltipWidth = 400;
          const tooltipHeight = 200;
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          
          const newPosition: TooltipPosition = {};
          
          // Smart positioning based on available space
          const spaceRight = viewportWidth - rect.right;
          const spaceLeft = rect.left;
          const spaceBottom = viewportHeight - rect.bottom;
          const spaceTop = rect.top;
          
          if (spaceRight > tooltipWidth + 20) {
            // Position to the right
            newPosition.left = rect.right + 20;
            newPosition.top = Math.max(20, Math.min(rect.top, viewportHeight - tooltipHeight - 20));
          } else if (spaceLeft > tooltipWidth + 20) {
            // Position to the left
            newPosition.right = viewportWidth - rect.left + 20;
            newPosition.top = Math.max(20, Math.min(rect.top, viewportHeight - tooltipHeight - 20));
          } else if (spaceBottom > tooltipHeight + 20) {
            // Position below
            newPosition.top = rect.bottom + 20;
            newPosition.left = Math.max(20, Math.min(rect.left + rect.width/2 - tooltipWidth/2, viewportWidth - tooltipWidth - 20));
          } else if (spaceTop > tooltipHeight + 20) {
            // Position above
            newPosition.bottom = viewportHeight - rect.top + 20;
            newPosition.left = Math.max(20, Math.min(rect.left + rect.width/2 - tooltipWidth/2, viewportWidth - tooltipWidth - 20));
          } else {
            // Fallback to center
            newPosition.top = '50%';
            newPosition.left = '50%';
            newPosition.transform = 'translate(-50%, -50%)';
          }
          
          setTooltipPosition(newPosition);
          setShowPulse(true);
        } else {
          // Element not found, show center tooltip
          setSpotlightPosition(null);
          setTooltipPosition({
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          });
        }
      } else {
        // No target selector, show center tooltip without spotlight
        setSpotlightPosition(null);
        setTooltipPosition({
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        });
      }
      
      setIsAnimating(false);
      
      // Pulse effect for spotlight
      setTimeout(() => setShowPulse(false), 2000);
    };

    const timer = setTimeout(updatePositions, 150);
    
    // Removed auto-advance for better user control
    // Users should manually progress through tutorial steps
    
    window.addEventListener('resize', updatePositions);
    
    return () => {
      clearTimeout(timer);
      if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer);
      window.removeEventListener('resize', updatePositions);
    };
  }, [currentStep, location.pathname, isActive, navigate, isPaused]);

  const handleNext = () => {
    if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer);
    
    if (currentStep?.action) {
      currentStep.action();
    }
    
    if (currentStepIndex === totalSteps - 1) {
      // Mark tutorial as completed for this user's lifetime
      markExperienceComplete(EXPERIENCE_IDS.WELCOME_TUTORIAL, {
        completed_steps: totalSteps,
        completion_method: 'completed'
      });
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

  const isLastStep = currentStepIndex === totalSteps - 1;
  const isFirstStep = currentStepIndex === 0;
  const progressPercentage = ((currentStepIndex + 1) / totalSteps) * 100;

  if (!isActive || !currentStep) return null;

  // Create spotlight mask path
  const createSpotlightMask = () => {
    if (!spotlightPosition) return '';
    
    const { top, left, width, height } = spotlightPosition;
    const borderRadius = 12;
    
    return `
      M 0 0 
      L ${window.innerWidth} 0 
      L ${window.innerWidth} ${window.innerHeight} 
      L 0 ${window.innerHeight} 
      Z 
      M ${left + borderRadius} ${top} 
      L ${left + width - borderRadius} ${top} 
      Q ${left + width} ${top} ${left + width} ${top + borderRadius} 
      L ${left + width} ${top + height - borderRadius} 
      Q ${left + width} ${top + height} ${left + width - borderRadius} ${top + height} 
      L ${left + borderRadius} ${top + height} 
      Q ${left} ${top + height} ${left} ${top + height - borderRadius} 
      L ${left} ${top + borderRadius} 
      Q ${left} ${top} ${left + borderRadius} ${top} 
      Z
    `;
  };

  return (
    <>
      {/* Sophisticated overlay with spotlight cutout */}
      <div className="fixed inset-0 z-[50] pointer-events-none">
        <svg
          width="100%"
          height="100%"
          className="absolute inset-0"
          style={{ pointerEvents: 'none' }}
        >
          <defs>
            <pattern id="dots" patternUnits="userSpaceOnUse" width="20" height="20">
              <circle cx="2" cy="2" r="1" fill="rgba(255,255,255,0.1)" />
            </pattern>
            <radialGradient id="spotlightGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(139, 92, 246, 0.3)" />
              <stop offset="100%" stopColor="rgba(139, 92, 246, 0.1)" />
            </radialGradient>
          </defs>
          
          <path
            d={createSpotlightMask()}
            fill="rgba(0, 0, 0, 0.2)"
            fillRule="evenodd"
          />
          
          {spotlightPosition && (
            <>
              {/* Spotlight ring */}
              <rect
                x={spotlightPosition.left - 2}
                y={spotlightPosition.top - 2}
                width={spotlightPosition.width + 4}
                height={spotlightPosition.height + 4}
                fill="none"
                stroke="url(#spotlightGradient)"
                strokeWidth="2"
                rx="14"
                className={`transition-all duration-500 ${showPulse ? 'animate-pulse' : ''}`}
              />
              
              {/* Animated pulse ring */}
              <rect
                x={spotlightPosition.left - 8}
                y={spotlightPosition.top - 8}
                width={spotlightPosition.width + 16}
                height={spotlightPosition.height + 16}
                fill="none"
                stroke="rgba(139, 92, 246, 0.6)"
                strokeWidth="1"
                rx="20"
                className="animate-ping"
                style={{ animationDuration: '2s' }}
              />
            </>
          )}
        </svg>
      </div>

      {/* Progress indicator - always visible */}
      <div className="fixed top-6 right-6 z-[53]">
        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 min-w-[200px]">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-900">Tutorial</span>
                  <span className="text-xs text-gray-500">{currentStepIndex + 1}/{totalSteps}</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={skipOnboarding}
                className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tutorial tooltip - contextual and non-blocking */}
      <div
        className={`fixed z-[52] transition-all duration-500 ease-out ${
          isAnimating ? 'opacity-0 scale-95 translate-y-2' : 'opacity-100 scale-100 translate-y-0'
        }`}
        style={{
          ...tooltipPosition,
          maxWidth: currentStep.targetSelector ? '400px' : '500px'
        }}
      >
        <Card className="bg-white/95 backdrop-blur-md border shadow-lg overflow-hidden max-w-sm">
          {/* Header with step info */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 text-white">
            <div className="flex items-center justify-between mb-1">
              <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs">
                <Target className="mr-1 h-3 w-3" />
                Step {currentStepIndex + 1}
              </Badge>
              <div className="flex items-center gap-1 text-xs text-white/80">
                <Eye className="h-3 w-3" />
                Interactive
              </div>
            </div>
            <h3 className="text-base font-semibold">{currentStep.title}</h3>
          </div>
          
          <CardContent className="p-4">
            <p className="text-gray-700 text-sm leading-relaxed mb-4">
              {currentStep.description}
            </p>
            
            {/* Action buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {!isFirstStep && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevious}
                    className="text-gray-600 border-gray-200"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // Mark tutorial as seen even if skipped, so user won't see it again
                    markExperienceComplete(EXPERIENCE_IDS.WELCOME_TUTORIAL, {
                      completed_steps: currentStepIndex + 1,
                      completion_method: 'skipped'
                    });
                    skipOnboarding();
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <SkipForward className="h-4 w-4 mr-1" />
                  Skip Tutorial
                </Button>
              </div>
              
              <Button
                onClick={handleNext}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg"
              >
                {isLastStep ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tooltip pointer/arrow */}
        {currentStep.targetSelector && spotlightPosition && (
          <div 
            className="absolute w-4 h-4 bg-white rotate-45 border-l border-t border-gray-200"
            style={{
              ...(tooltipPosition.left !== undefined && tooltipPosition.top !== undefined && 
                  typeof tooltipPosition.left === 'number' && typeof tooltipPosition.top === 'number' ? {
                // Pointing from right
                left: -8,
                top: 24
              } : tooltipPosition.right !== undefined ? {
                // Pointing from left  
                right: -8,
                top: 24
              } : tooltipPosition.bottom !== undefined ? {
                // Pointing from top
                bottom: -8,
                left: '50%',
                transform: 'translateX(-50%)'
              } : {
                // Pointing from bottom
                top: -8,
                left: '50%',
                transform: 'translateX(-50%)'
              })
            }}
          />
        )}
      </div>

      {/* Floating action hint for interactive elements */}
      {currentStep.targetSelector && spotlightPosition && (
        <div
          className="fixed z-[51] pointer-events-none"
          style={{
            left: spotlightPosition.left + spotlightPosition.width + 8,
            top: spotlightPosition.top - 8
          }}
        >
          <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 shadow-lg border animate-bounce">
            <Navigation className="h-3 w-3 text-purple-500" />
            <span className="text-xs font-medium text-gray-700">Try this!</span>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfessionalTutorialOverlay;
