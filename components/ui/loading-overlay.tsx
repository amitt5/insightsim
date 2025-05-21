'use client'

import { cn } from "@/lib/utils"
import { forwardRef } from "react"

// Loading overlay component with refined styling and animations
export interface LoadingOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  isLoading?: boolean;
  text?: string;
  variant?: 'default' | 'blur' | 'fade';
  spinner?: boolean;
}

const LoadingOverlay = forwardRef<HTMLDivElement, LoadingOverlayProps>(
  ({ className, isLoading = true, text, variant = 'default', spinner = true, children, ...props }, ref) => {
    const variantClasses = {
      default: 'bg-background/80',
      blur: 'backdrop-blur-sm bg-background/50',
      fade: 'bg-background/95',
    }
    
    return (
      <div className="relative w-full h-full">
        {children}
        
        {isLoading && (
          <div
            ref={ref}
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center z-50",
              "transition-opacity duration-300",
              variantClasses[variant],
              className
            )}
            {...props}
          >
            {spinner && (
              <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin mb-3" />
            )}
            
            {text && (
              <div className="text-sm text-muted-foreground animate-pulse">{text}</div>
            )}
          </div>
        )}
      </div>
    )
  }
)
LoadingOverlay.displayName = "LoadingOverlay"

export { LoadingOverlay }
