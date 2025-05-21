'use client'

import { cn } from "@/lib/utils"
import { forwardRef } from "react"

// Enhanced badge component with refined styling and states
export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'destructive';
}

const badgeVariants = {
  default: "bg-primary/10 text-primary hover:bg-primary/20",
  primary: "bg-primary text-primary-foreground hover:bg-primary-light",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary-light",
  outline: "border border-input bg-background hover:bg-muted hover:text-foreground",
  destructive: "bg-destructive/10 text-destructive hover:bg-destructive/20",
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
          "transition-colors duration-200",
          badgeVariants[variant],
          className
        )}
        {...props}
      />
    )
  }
)
Badge.displayName = "Badge"

export { Badge }
