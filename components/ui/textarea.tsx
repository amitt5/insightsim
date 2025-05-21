'use client'

import { cn } from "@/lib/utils"
import { forwardRef } from "react"

// Enhanced textarea component with refined styling and states
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 typography-body",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "hover:border-primary/50 focus:border-primary",
          "transition-colors duration-200",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/50",
          "resize-vertical",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
