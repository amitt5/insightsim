'use client'

import { cn } from "@/lib/utils"
import { forwardRef } from "react"

// Responsive container component for consistent layouts
export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  centered?: boolean;
}

const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size = 'lg', centered = false, ...props }, ref) => {
    const sizeClasses = {
      sm: 'max-w-screen-sm',
      md: 'max-w-screen-md',
      lg: 'max-w-screen-lg',
      xl: 'max-w-screen-xl',
      full: 'max-w-full',
    }
    
    return (
      <div
        ref={ref}
        className={cn(
          "w-full px-4 sm:px-6 md:px-8",
          sizeClasses[size],
          centered && "mx-auto",
          className
        )}
        {...props}
      />
    )
  }
)
Container.displayName = "Container"

export { Container }
