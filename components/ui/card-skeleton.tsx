'use client'

import { cn } from "@/lib/utils"
import { forwardRef } from "react"

// Card skeleton loader component for content loading states
export interface CardSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: boolean;
  lines?: number;
  footer?: boolean;
}

const CardSkeleton = forwardRef<HTMLDivElement, CardSkeletonProps>(
  ({ className, header = true, lines = 3, footer = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border bg-card p-6 shadow-sm",
          className
        )}
        {...props}
      >
        {header && (
          <div className="space-y-2 mb-4">
            <div className="h-5 w-2/5 bg-muted/60 rounded animate-pulse" />
            <div className="h-4 w-4/5 bg-muted/40 rounded animate-pulse" />
          </div>
        )}
        
        <div className="space-y-3">
          {Array.from({ length: lines }).map((_, i) => (
            <div 
              key={i} 
              className={cn(
                "h-4 bg-muted/60 rounded animate-pulse",
                i === lines - 1 ? "w-4/5" : "w-full"
              )}
              style={{ 
                animationDelay: `${i * 100}ms`,
                opacity: 1 - (i * 0.1)
              }}
            />
          ))}
        </div>
        
        {footer && (
          <div className="mt-4 pt-4 border-t border-border/50 flex justify-end">
            <div className="h-9 w-20 bg-muted/60 rounded animate-pulse" />
          </div>
        )}
      </div>
    )
  }
)
CardSkeleton.displayName = "CardSkeleton"

export { CardSkeleton }
