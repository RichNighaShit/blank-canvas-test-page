import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useOnboarding } from './OnboardingProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, ArrowRight, ArrowLeft, SkipForward } from 'lucide-react';

interface TooltipPosition {
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
}

export const OnboardingOverlay: React.FC = () => {
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

  // Update tooltip position when step changes or page changes
  useEffect(() => {
    if (!isActive || !currentStep) return;

    // Check if we need to navigate to a different page
    if (currentStep.page && location.pathname !== currentStep.page) {
      navigate(currentStep.page);
      return;
    }

    // Calculate tooltip position
    const updatePosition = () => {
      if (currentStep.targetSelector) {
        const targetElement = document.querySelector(currentStep.targetSelector);
        if (targetElement) {
          const rect = targetElement.getBoundingClientRect();
          const tooltipWidth = 400;
          const tooltipHeight = 200;
          
          // Create highlight effect
          setHighlightStyle({
            position: 'fixed',
            top: rect.top - 8,
            left: rect.left - 8,
            width: rect.width + 16,
            height: rect.height + 16,
            border: '3px solid #8b5cf6',
            borderRadius: '12px',
            boxShadow: '0 0 0 4px rgba(139, 92, 246, 0.2), 0 0 20px rgba(139, 92, 246, 0.3)',
            zIndex: 9998,
            pointerEvents: 'none',
            animation: 'pulse 2s infinite'
          });

          // Position tooltip based on position prop
          const newPosition: TooltipPosition = {};
          
          switch (currentStep.position) {
            case 'top':
              newPosition.bottom = window.innerHeight - rect.top + 20;
              newPosition.left = Math.max(20, rect.left + rect.width/2 - tooltipWidth/2);
              break;
            case 'bottom':
              newPosition.top = rect.bottom + 20;
              newPosition.left = Math.max(20, rect.left + rect.width/2 - tooltipWidth/2);
              break;
            case 'left':
              newPosition.right = window.innerWidth - rect.left + 20;
              newPosition.top = Math.max(20, rect.top + rect.height/2 - tooltipHeight/2);
              break;
            case 'right':
              newPosition.left = rect.right + 20;
              newPosition.top = Math.max(20, rect.top + rect.height/2 - tooltipHeight/2);
              break;
            default:
              newPosition.top = rect.bottom + 20;
              newPosition.left = Math.max(20, rect.left + rect.width/2 - tooltipWidth/2);
          }
          
          setTooltipPosition(newPosition);
        }
      } else {
        // Center the tooltip
        setTooltipPosition({
          top: '50%',
          left: '50%'
        });
        setHighlightStyle({});
      }
    };

    // Wait for page to load, then update position
    const timer = setTimeout(updatePosition, 100);
    
    // Update position on resize
    window.addEventListener('resize', updatePosition);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updatePosition);
    };
  }, [currentStep, location.pathname, isActive, navigate]);

  const handleNext = () => {
    if (currentStep?.action) {
      currentStep.action();
    }
    
    if (currentStepIndex === totalSteps - 1) {
      completeOnboarding();
    } else {
      nextStep();
    }
  };

  const isLastStep = currentStepIndex === totalSteps - 1;
  const isFirstStep = currentStepIndex === 0;

  if (!isActive || !currentStep) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9997]" />
      
      {/* Highlight */}
      {currentStep.targetSelector && (
        <div style={highlightStyle} />
      )}
      
      {/* Tooltip */}
      <div
        className="fixed z-[9999] max-w-md"
        style={{
          ...tooltipPosition,
          ...(tooltipPosition.top === '50%' && tooltipPosition.left === '50%' 
            ? { transform: 'translate(-50%, -50%)' } 
            : {})
        }}
      >
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                Step {currentStepIndex + 1} of {totalSteps}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={skipOnboarding}
                className="h-8 w-8 p-0 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardTitle className="text-xl font-semibold text-gray-900">
              {currentStep.title}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <p className="text-gray-600 leading-relaxed">
              {currentStep.description}
            </p>
            
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-2">
                {!isFirstStep && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={previousStep}
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
                  Skip Tour
                </Button>
              </div>
              
              <Button
                onClick={handleNext}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isLastStep ? 'Get Started' : 'Next'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
            
            {/* Progress indicator */}
            <div className="flex space-x-1 pt-2">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <div
                  key={index}
                  className={`h-2 flex-1 rounded-full transition-colors ${
                    index <= currentStepIndex
                      ? 'bg-purple-600'
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pulse animation styles */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
      `}</style>
    </>
  );
};
