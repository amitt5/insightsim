'use client'

import { cn } from "@/lib/utils"
import { forwardRef } from "react"

// Responsive stack component for vertical layouts
export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  spacing?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  responsive?: boolean;
}

const Stack = forwardRef<HTMLDivElement, StackProps>(
  ({ className, spacing = 'md', responsive = true, ...props }, ref) => {
    const spacingClasses = {
      none: 'space-y-0',
      xs: 'space-y-1',
      sm: 'space-y-2',
      md: 'space-y-4',
      lg: 'space-y-6',
      xl: 'space-y-8',
    }
    
    const responsiveSpacingClasses = {
      none: '',
      xs: 'sm:space-y-2',
      sm: 'sm:space-y-3',
      md: 'sm:space-y-5 md:space-y-6',
      lg: 'sm:space-y-8 md:space-y-10',
      xl: 'sm:space-y-10 md:space-y-12',
    }
    
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col w-full",
          spacingClasses[spacing],
          responsive && responsiveSpacingClasses[spacing],
          className
        )}
        {...props}
      />
    )
  }
)
Stack.displayName = "Stack"

export { Stack }
