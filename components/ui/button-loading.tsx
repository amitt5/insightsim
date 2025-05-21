'use client'

import { cn } from "@/lib/utils"
import { forwardRef } from "react"

// Button loading state component
export interface ButtonLoadingProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  spinner?: boolean;
}

const ButtonLoading = forwardRef<HTMLButtonElement, ButtonLoadingProps>(
  ({ className, isLoading = false, loadingText, spinner = true, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          "bg-primary text-primary-foreground hover:bg-primary-light active:bg-primary-lighter typography-button shadow-sm hover:shadow",
          "h-10 px-4 py-2",
          "relative",
          className
        )}
        disabled={isLoading || disabled}
        {...props}
      >
        {isLoading && spinner && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
          </span>
        )}
        
        <span className={cn(
          "flex items-center gap-2 transition-opacity",
          isLoading ? "opacity-0" : "opacity-100"
        )}>
          {children}
        </span>
        
        {isLoading && loadingText && (
          <span className="absolute inset-0 flex items-center justify-center">
            {loadingText}
          </span>
        )}
      </button>
    )
  }
)
ButtonLoading.displayName = "ButtonLoading"

export { ButtonLoading }
