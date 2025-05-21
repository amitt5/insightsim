'use client'

import { cn } from "@/lib/utils"
import { forwardRef } from "react"

// Form validation error component
export interface FormErrorProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string;
  inline?: boolean;
}

const FormError = forwardRef<HTMLDivElement, FormErrorProps>(
  ({ className, message, inline = false, ...props }, ref) => {
    if (!message) return null;
    
    return (
      <div
        ref={ref}
        className={cn(
          "text-red-600 text-sm",
          inline ? "mt-0" : "mt-1",
          className
        )}
        {...props}
      >
        {message}
      </div>
    )
  }
)
FormError.displayName = "FormError"

export { FormError }
