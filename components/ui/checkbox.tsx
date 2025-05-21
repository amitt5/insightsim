'use client'

import { cn } from "@/lib/utils"
import { forwardRef } from "react"

// Enhanced checkbox component with refined styling and states
export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className="relative flex items-center">
        <input
          type="checkbox"
          className={cn(
            "peer h-4 w-4 shrink-0 rounded-sm border border-input ring-offset-background",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
            "hover:border-primary/50 focus:border-primary",
            "transition-colors duration-200",
            className
          )}
          ref={ref}
          {...props}
        />
        <div className="absolute left-0 top-0 h-4 w-4 pointer-events-none opacity-0 peer-data-[state=checked]:opacity-100 transition-opacity duration-200">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 text-primary-foreground"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      </div>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
