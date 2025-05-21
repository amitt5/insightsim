'use client'

import { cn } from "@/lib/utils"
import { forwardRef } from "react"

// First-time user welcome component
export interface WelcomeGuidanceProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  steps?: {
    title: string;
    description: string;
    icon?: React.ReactNode;
  }[];
  onDismiss?: () => void;
  onStartTour?: () => void;
}

const WelcomeGuidance = forwardRef<HTMLDivElement, WelcomeGuidanceProps>(
  ({ className, title, description, steps, onDismiss, onStartTour, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-card border border-border rounded-lg shadow-lg p-6 max-w-md mx-auto",
          className
        )}
        {...props}
      >
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold mb-2">{title || "Welcome to InsightSim"}</h2>
          <p className="text-muted-foreground">
            {description || "Let's get you started with a quick tour of the platform."}
          </p>
        </div>
        
        {steps && steps.length > 0 && (
          <div className="space-y-4 mb-6">
            {steps.map((step, index) => (
              <div key={index} className="flex items-start">
                <div className="flex-shrink-0 mr-3">
                  {step.icon || (
                    <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      {index + 1}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-medium">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex justify-between">
          <button
            onClick={onDismiss}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            Skip for now
          </button>
          
          <button
            onClick={onStartTour}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary-light"
          >
            Start tour
          </button>
        </div>
      </div>
    )
  }
)
WelcomeGuidance.displayName = "WelcomeGuidance"

export { WelcomeGuidance }
