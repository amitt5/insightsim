'use client'

import { cn } from "@/lib/utils"
import { forwardRef } from "react"

// Skeleton loader component with refined styling
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'card' | 'text' | 'avatar' | 'button';
}

const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variantClasses = {
      default: 'rounded-md',
      card: 'rounded-lg h-[180px]',
      text: 'h-4 w-full rounded',
      avatar: 'h-12 w-12 rounded-full',
      button: 'h-10 w-24 rounded-md',
    }
    
    return (
      <div
        ref={ref}
        className={cn(
          "bg-muted/60 animate-pulse",
          variantClasses[variant],
          className
        )}
        {...props}
      />
    )
  }
)
Skeleton.displayName = "Skeleton"

export { Skeleton }
