'use client'

import { cn } from "@/lib/utils"
import { forwardRef } from "react"

// Animated transition component for smooth UI changes
export interface TransitionProps extends React.HTMLAttributes<HTMLDivElement> {
  show?: boolean;
  type?: 'fade' | 'slide-up' | 'slide-down' | 'zoom' | 'none';
  duration?: 'fast' | 'normal' | 'slow';
}

const Transition = forwardRef<HTMLDivElement, TransitionProps>(
  ({ className, show = true, type = 'fade', duration = 'normal', children, ...props }, ref) => {
    const typeClasses = {
      'fade': show 
        ? 'opacity-100' 
        : 'opacity-0',
      'slide-up': show 
        ? 'opacity-100 translate-y-0' 
        : 'opacity-0 translate-y-4',
      'slide-down': show 
        ? 'opacity-100 translate-y-0' 
        : 'opacity-0 translate-y-[-1rem]',
      'zoom': show 
        ? 'opacity-100 scale-100' 
        : 'opacity-0 scale-95',
      'none': '',
    }
    
    const durationClasses = {
      'fast': 'duration-150',
      'normal': 'duration-300',
      'slow': 'duration-500',
    }
    
    return (
      <div
        ref={ref}
        className={cn(
          "transition-all",
          durationClasses[duration],
          typeClasses[type],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Transition.displayName = "Transition"

export { Transition }
