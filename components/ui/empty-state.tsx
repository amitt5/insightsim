'use client'

import { cn } from "@/lib/utils"
import { forwardRef } from "react"

// Empty state component for sections without data
export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  variant?: 'default' | 'compact' | 'card';
}

const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, title, description, icon, action, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center text-center",
          {
            "p-8 md:p-12": variant === 'default',
            "p-4 md:p-6": variant === 'compact',
            "p-6 md:p-8 border rounded-lg bg-card shadow-sm": variant === 'card',
          },
          className
        )}
        {...props}
      >
        {icon && (
          <div className="mb-4 text-muted-foreground">
            {icon}
          </div>
        )}
        
        {title && (
          <h3 className="text-lg font-medium mb-2">{title}</h3>
        )}
        
        {description && (
          <p className="text-muted-foreground mb-4 max-w-md">{description}</p>
        )}
        
        {action && (
          <div className="mt-2">
            {action}
          </div>
        )}
      </div>
    )
  }
)
EmptyState.displayName = "EmptyState"

export { EmptyState }
