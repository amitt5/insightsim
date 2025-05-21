'use client'

import { cn } from "@/lib/utils"
import { forwardRef } from "react"

// Responsive card layout component
export interface CardLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: 1 | 2 | 3 | 4;
  spacing?: 'sm' | 'md' | 'lg';
}

const CardLayout = forwardRef<HTMLDivElement, CardLayoutProps>(
  ({ className, columns = 1, spacing = 'md', children, ...props }, ref) => {
    const columnsClasses = {
      1: 'grid-cols-1',
      2: 'grid-cols-1 sm:grid-cols-2',
      3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    }
    
    const spacingClasses = {
      sm: 'gap-4',
      md: 'gap-6',
      lg: 'gap-8',
    }
    
    return (
      <div
        ref={ref}
        className={cn(
          "grid w-full",
          columnsClasses[columns],
          spacingClasses[spacing],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
CardLayout.displayName = "CardLayout"

export { CardLayout }
