'use client'

import { cn } from "@/lib/utils"
import { forwardRef } from "react"

// User guidance component for tooltips and contextual help
export interface TooltipGuidanceProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  content: string;
  position?: 'top' | 'right' | 'bottom' | 'left';
  trigger?: React.ReactNode;
  variant?: 'default' | 'info' | 'highlight';
}

const TooltipGuidance = forwardRef<HTMLDivElement, TooltipGuidanceProps>(
  ({ className, title, content, position = 'top', trigger, variant = 'default', ...props }, ref) => {
    const variantClasses = {
      default: "bg-popover text-popover-foreground shadow-md",
      info: "bg-blue-50 text-blue-900 border border-blue-200",
      highlight: "bg-yellow-50 text-yellow-900 border border-yellow-200",
    }
    
    const positionClasses = {
      top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
      right: "left-full top-1/2 -translate-y-1/2 ml-2",
      bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
      left: "right-full top-1/2 -translate-y-1/2 mr-2",
    }
    
    const arrowClasses = {
      top: "bottom-[-6px] left-1/2 -translate-x-1/2 border-t-current border-l-transparent border-r-transparent border-b-transparent",
      right: "left-[-6px] top-1/2 -translate-y-1/2 border-r-current border-t-transparent border-b-transparent border-l-transparent",
      bottom: "top-[-6px] left-1/2 -translate-x-1/2 border-b-current border-l-transparent border-r-transparent border-t-transparent",
      left: "right-[-6px] top-1/2 -translate-y-1/2 border-l-current border-t-transparent border-b-transparent border-r-transparent",
    }
    
    return (
      <div className="relative inline-block group">
        {trigger}
        
        <div
          ref={ref}
          className={cn(
            "absolute z-50 w-64 p-3 rounded-md",
            "invisible group-hover:visible opacity-0 group-hover:opacity-100",
            "transition-opacity duration-300",
            positionClasses[position],
            variantClasses[variant],
            className
          )}
          {...props}
        >
          {title && (
            <div className="font-medium mb-1">{title}</div>
          )}
          
          <div className="text-sm">{content}</div>
          
          <div 
            className={cn(
              "absolute w-0 h-0 border-[6px]",
              arrowClasses[position]
            )}
          />
        </div>
      </div>
    )
  }
)
TooltipGuidance.displayName = "TooltipGuidance"

export { TooltipGuidance }
