'use client'

import { cn } from "@/lib/utils"
import { forwardRef } from "react"

// Progress bar component with refined styling and animations
export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  variant?: 'default' | 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
}

const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, variant = 'default', size = 'md', showValue = false, ...props }, ref) => {
    const percentage = Math.min(Math.max(value, 0), max) / max * 100;
    
    const sizeClasses = {
      sm: 'h-1',
      md: 'h-2',
      lg: 'h-3',
    }
    
    const variantClasses = {
      default: 'bg-muted-foreground/20 [&>div]:bg-foreground',
      primary: 'bg-primary/20 [&>div]:bg-primary',
      secondary: 'bg-secondary/20 [&>div]:bg-secondary',
    }
    
    return (
      <div className="w-full flex flex-col gap-1">
        <div
          ref={ref}
          className={cn(
            "w-full overflow-hidden rounded-full",
            sizeClasses[size],
            variantClasses[variant],
            className
          )}
          {...props}
        >
          <div
            className="h-full transition-all duration-500 ease-in-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
        {showValue && (
          <div className="text-xs text-muted-foreground text-right">
            {Math.round(percentage)}%
          </div>
        )}
      </div>
    )
  }
)
Progress.displayName = "Progress"

export { Progress }
