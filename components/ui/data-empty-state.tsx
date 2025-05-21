'use client'

import { cn } from "@/lib/utils"
import { forwardRef } from "react"

// Data empty state component for tables and lists
export interface DataEmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  isLoading?: boolean;
}

const DataEmptyState = forwardRef<HTMLDivElement, DataEmptyStateProps>(
  ({ className, title, description, icon, action, isLoading = false, ...props }, ref) => {
    const defaultIcon = (
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="3" y1="9" x2="21" y2="9"></line>
        <line x1="9" y1="21" x2="9" y2="9"></line>
      </svg>
    );
    
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center text-center p-6 min-h-[200px]",
          className
        )}
        {...props}
      >
        {isLoading ? (
          <div className="flex flex-col items-center">
            <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin mb-3" />
            <p className="text-muted-foreground">Loading data...</p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-muted-foreground">
              {icon || defaultIcon}
            </div>
            
            <h3 className="text-lg font-medium mb-2">{title || "No data available"}</h3>
            
            <p className="text-muted-foreground mb-4 max-w-md">
              {description || "There are no items to display at this time."}
            </p>
            
            {action && (
              <div className="mt-2">
                {action}
              </div>
            )}
          </>
        )}
      </div>
    )
  }
)
DataEmptyState.displayName = "DataEmptyState"

export { DataEmptyState }
