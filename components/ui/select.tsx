'use client'

import { cn } from "@/lib/utils"
import { forwardRef } from "react"

// Enhanced select component with refined styling and states
export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 typography-body",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "hover:border-primary/50 focus:border-primary",
          "transition-colors duration-200",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/50",
          "appearance-none bg-no-repeat bg-[right_0.5rem_center] bg-[length:1rem]",
          "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23666%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')]",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    )
  }
)
Select.displayName = "Select"

export { Select }
