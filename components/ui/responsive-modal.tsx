'use client'

import { cn } from "@/lib/utils"
import { forwardRef } from "react"

// Responsive modal component with mobile-friendly behavior
export interface ResponsiveModalProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  fullScreenOnMobile?: boolean;
}

const ResponsiveModal = forwardRef<HTMLDivElement, ResponsiveModalProps>(
  ({ className, size = 'md', fullScreenOnMobile = true, children, ...props }, ref) => {
    const sizeClasses = {
      sm: 'sm:max-w-sm',
      md: 'sm:max-w-md',
      lg: 'sm:max-w-lg',
      xl: 'sm:max-w-xl',
      full: 'sm:max-w-full sm:w-[calc(100%-2rem)]',
    }
    
    return (
      <div
        ref={ref}
        className={cn(
          "bg-background border border-border shadow-lg",
          "w-full p-0",
          "transition-all duration-200",
          fullScreenOnMobile ? "rounded-none sm:rounded-lg h-full sm:h-auto" : "rounded-lg",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
ResponsiveModal.displayName = "ResponsiveModal"

export { ResponsiveModal }
