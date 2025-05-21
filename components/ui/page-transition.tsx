'use client'

import { cn } from "@/lib/utils"
import { forwardRef } from "react"

// Page transition component for smooth navigation
export interface PageTransitionProps extends React.HTMLAttributes<HTMLDivElement> {
  isLoading?: boolean;
}

const PageTransition = forwardRef<HTMLDivElement, PageTransitionProps>(
  ({ className, isLoading = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "w-full transition-opacity duration-300 ease-in-out",
          isLoading ? "opacity-0" : "opacity-100",
          className
        )}
        {...props}
      >
        {children}
        
        {isLoading && (
          <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 rounded-full border-3 border-primary/30 border-t-primary animate-spin" />
              <div className="text-sm text-muted-foreground animate-pulse">Loading page...</div>
            </div>
          </div>
        )}
      </div>
    )
  }
)
PageTransition.displayName = "PageTransition"

export { PageTransition }
