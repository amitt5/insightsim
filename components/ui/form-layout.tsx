'use client'

import { cn } from "@/lib/utils"
import { forwardRef } from "react"

// Responsive form layout component
export interface FormLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: 1 | 2 | 3;
  spacing?: 'sm' | 'md' | 'lg';
}

const FormLayout = forwardRef<HTMLDivElement, FormLayoutProps>(
  ({ className, columns = 1, spacing = 'md', children, ...props }, ref) => {
    const columnsClasses = {
      1: 'grid-cols-1',
      2: 'grid-cols-1 md:grid-cols-2',
      3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
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
FormLayout.displayName = "FormLayout"

// Form field component with responsive layout
export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  span?: 1 | 2 | 3 | 'full';
}

const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  ({ className, span = 1, children, ...props }, ref) => {
    const spanClasses = {
      1: 'col-span-1',
      2: 'col-span-1 md:col-span-2',
      3: 'col-span-1 md:col-span-2 lg:col-span-3',
      'full': 'col-span-full',
    }
    
    return (
      <div
        ref={ref}
        className={cn(
          spanClasses[span],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
FormField.displayName = "FormField"

export { FormLayout, FormField }
