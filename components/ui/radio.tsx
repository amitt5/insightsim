'use client'

import { cn } from "@/lib/utils"
import { forwardRef } from "react"

// Enhanced radio component with refined styling and states
export interface RadioProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className="relative flex items-center">
        <input
          type="radio"
          className={cn(
            "peer h-4 w-4 shrink-0 rounded-full border border-input ring-offset-background",
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
        <div className="absolute left-0 top-0 h-4 w-4 flex items-center justify-center pointer-events-none opacity-0 peer-data-[state=checked]:opacity-100 transition-opacity duration-200">
          <div className="h-2 w-2 rounded-full bg-primary-foreground"></div>
        </div>
      </div>
    )
  }
)
Radio.displayName = "Radio"

export { Radio }
