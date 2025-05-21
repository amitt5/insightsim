'use client'

import { cn } from "@/lib/utils"
import { forwardRef } from "react"

// Enhanced typography component with consistent styling
export interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body-large' | 'body' | 'body-small' | 'button' | 'button-large' | 'button-small' | 'label' | 'caption' | 'overline'
  as?: keyof JSX.IntrinsicElements
  truncate?: boolean | number
}

const Typography = forwardRef<HTMLElement, TypographyProps>(
  ({ className, variant = 'body', as, children, truncate, ...props }, ref) => {
    // Map variant to typography class
    const variantClass = `typography-${variant}`
    
    // Handle truncation
    let truncateClass = ''
    if (truncate === true) {
      truncateClass = 'truncate-1'
    } else if (typeof truncate === 'number') {
      truncateClass = `truncate-${truncate}`
    }
    
    // Determine which HTML element to render
    const Component = as || getDefaultElement(variant)
    
    return (
      <Component
        className={cn(variantClass, truncateClass, className)}
        ref={ref as any}
        {...props}
      >
        {children}
      </Component>
    )
  }
)

// Helper function to determine default HTML element based on variant
function getDefaultElement(variant: string): keyof JSX.IntrinsicElements {
  if (variant.startsWith('h')) {
    return variant as keyof JSX.IntrinsicElements
  }
  
  switch (variant) {
    case 'body-large':
    case 'body':
    case 'body-small':
      return 'p'
    case 'button':
    case 'button-large':
    case 'button-small':
      return 'span'
    case 'label':
      return 'label'
    case 'caption':
      return 'span'
    case 'overline':
      return 'span'
    default:
      return 'p'
  }
}

Typography.displayName = "Typography"

export { Typography }
