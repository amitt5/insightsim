'use client'

import { cn } from "@/lib/utils"
import { forwardRef } from "react"

// Onboarding guidance component for first-time users
export interface OnboardingGuidanceProps extends React.HTMLAttributes<HTMLDivElement> {
  steps: {
    title: string;
    description: string;
    target?: string;
    position?: 'top' | 'right' | 'bottom' | 'left';
  }[];
  currentStep: number;
  onNext?: () => void;
  onPrevious?: () => void;
  onClose?: () => void;
  showProgress?: boolean;
}

const OnboardingGuidance = forwardRef<HTMLDivElement, OnboardingGuidanceProps>(
  ({ className, steps, currentStep, onNext, onPrevious, onClose, showProgress = true, ...props }, ref) => {
    const step = steps[currentStep];
    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === steps.length - 1;
    
    const positionClasses = {
      top: "bottom-full left-1/2 -translate-x-1/2 mb-3",
      right: "left-full top-1/2 -translate-y-1/2 ml-3",
      bottom: "top-full left-1/2 -translate-x-1/2 mt-3",
      left: "right-full top-1/2 -translate-y-1/2 mr-3",
    };
    
    return (
      <div
        ref={ref}
        className={cn(
          "fixed z-50 w-72 p-4 rounded-lg shadow-lg",
          "bg-card border border-border",
          className
        )}
        style={{
          // This would be dynamically positioned based on the target element in a real implementation
          position: "fixed",
          bottom: "20px",
          right: "20px"
        }}
        {...props}
      >
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-medium text-lg">{step.title}</h4>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close onboarding"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4">{step.description}</p>
        
        {showProgress && (
          <div className="flex items-center justify-center mb-3 gap-1">
            {steps.map((_, index) => (
              <div 
                key={index}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  index === currentStep 
                    ? "w-4 bg-primary" 
                    : "w-1.5 bg-muted"
                )}
              />
            ))}
          </div>
        )}
        
        <div className="flex justify-between">
          <button
            onClick={onPrevious}
            disabled={isFirstStep}
            className={cn(
              "px-3 py-1 text-sm rounded",
              isFirstStep 
                ? "text-muted-foreground cursor-not-allowed" 
                : "text-foreground hover:bg-muted"
            )}
          >
            Previous
          </button>
          
          <button
            onClick={isLastStep ? onClose : onNext}
            className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary-light"
          >
            {isLastStep ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    )
  }
)
OnboardingGuidance.displayName = "OnboardingGuidance"

export { OnboardingGuidance }
