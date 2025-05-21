'use client'

import { cn } from "@/lib/utils"
import { forwardRef } from "react"

// Responsive grid component for flexible layouts
export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
  mdCols?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
  lgCols?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
  gap?: 'none' | 'sm' | 'md' | 'lg';
}

const Grid = forwardRef<HTMLDivElement, GridProps>(
  ({ className, cols = 1, mdCols, lgCols, gap = 'md', ...props }, ref) => {
    const colsClasses = {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      5: 'grid-cols-5',
      6: 'grid-cols-6',
      12: 'grid-cols-12',
    }
    
    const mdColsClasses = {
      1: 'md:grid-cols-1',
      2: 'md:grid-cols-2',
      3: 'md:grid-cols-3',
      4: 'md:grid-cols-4',
      5: 'md:grid-cols-5',
      6: 'md:grid-cols-6',
      12: 'md:grid-cols-12',
    }
    
    const lgColsClasses = {
      1: 'lg:grid-cols-1',
      2: 'lg:grid-cols-2',
      3: 'lg:grid-cols-3',
      4: 'lg:grid-cols-4',
      5: 'lg:grid-cols-5',
      6: 'lg:grid-cols-6',
      12: 'lg:grid-cols-12',
    }
    
    const gapClasses = {
      none: 'gap-0',
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6',
    }
    
    return (
      <div
        ref={ref}
        className={cn(
          "grid w-full",
          colsClasses[cols],
          mdCols && mdColsClasses[mdCols],
          lgCols && lgColsClasses[lgCols],
          gapClasses[gap],
          className
        )}
        {...props}
      />
    )
  }
)
Grid.displayName = "Grid"

export { Grid }
