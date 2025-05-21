'use client'

import { cn } from "@/lib/utils"
import { forwardRef } from "react"

// Form loading state component
export interface FormLoadingProps extends React.FormHTMLAttributes<HTMLFormElement> {
  isLoading?: boolean;
  loadingOverlay?: boolean;
  loadingText?: string;
}

const FormLoading = forwardRef<HTMLFormElement, FormLoadingProps>(
  ({ className, isLoading = false, loadingOverlay = true, loadingText = "Submitting...", children, ...props }, ref) => {
    return (
      <div className="relative">
        <form
          ref={ref}
          className={cn(
            isLoading && "pointer-events-none",
            className
          )}
          {...props}
        >
          <div className={cn(
            "transition-opacity duration-300",
            isLoading ? "opacity-50" : "opacity-100"
          )}>
            {children}
          </div>
        </form>
        
        {isLoading && loadingOverlay && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
            <div className="flex flex-col items-center gap-2">
              <div className="h-6 w-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
              {loadingText && (
                <div className="text-sm text-muted-foreground">{loadingText}</div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }
)
FormLoading.displayName = "FormLoading"

export { FormLoading }
