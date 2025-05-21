'use client'

import { cn } from "@/lib/utils"
import { forwardRef } from "react"

// Error state component for error handling and recovery
export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  variant?: 'default' | 'inline' | 'toast';
  status?: 'error' | 'warning' | 'info';
}

const ErrorState = forwardRef<HTMLDivElement, ErrorStateProps>(
  ({ className, title, description, icon, action, variant = 'default', status = 'error', ...props }, ref) => {
    const statusClasses = {
      error: "border-red-200 bg-red-50 text-red-900",
      warning: "border-yellow-200 bg-yellow-50 text-yellow-900",
      info: "border-blue-200 bg-blue-50 text-blue-900",
    }
    
    const iconColors = {
      error: "text-red-500",
      warning: "text-yellow-500",
      info: "text-blue-500",
    }
    
    return (
      <div
        ref={ref}
        className={cn(
          "border rounded-md",
          statusClasses[status],
          {
            "p-4": variant === 'default',
            "p-2 text-sm": variant === 'inline',
            "p-3 max-w-md shadow-lg": variant === 'toast',
          },
          className
        )}
        role="alert"
        {...props}
      >
        <div className={cn(
          "flex",
          variant === 'default' ? "items-start" : "items-center"
        )}>
          {icon && (
            <div className={cn(
              "flex-shrink-0 mr-3",
              iconColors[status]
            )}>
              {icon}
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            {title && (
              <h3 className={cn(
                "font-medium",
                variant === 'inline' ? "inline mr-1" : "mb-1"
              )}>
                {title}
              </h3>
            )}
            
            {description && (
              <div className={cn(
                variant === 'default' ? "text-sm" : "",
                variant === 'inline' ? "inline" : ""
              )}>
                {description}
              </div>
            )}
            
            {action && variant !== 'inline' && (
              <div className="mt-3">
                {action}
              </div>
            )}
          </div>
          
          {action && variant === 'inline' && (
            <div className="ml-3 flex-shrink-0">
              {action}
            </div>
          )}
        </div>
      </div>
    )
  }
)
ErrorState.displayName = "ErrorState"

export { ErrorState }
