'use client'

import { cn } from "@/lib/utils"
import { forwardRef } from "react"

// Loading spinner component with refined styling
export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'muted';
}

const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = 'md', variant = 'primary', ...props }, ref) => {
    const sizeClasses = {
      sm: 'h-4 w-4 border-2',
      md: 'h-6 w-6 border-2',
      lg: 'h-8 w-8 border-3',
    }
    
    const variantClasses = {
      primary: 'border-primary/30 border-t-primary',
      secondary: 'border-secondary/30 border-t-secondary',
      muted: 'border-muted-foreground/30 border-t-muted-foreground',
    }
    
    return (
      <div
        ref={ref}
        className={cn(
          "inline-block rounded-full animate-spin",
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      />
    )
  }
)
Spinner.displayName = "Spinner"

export { Spinner }
