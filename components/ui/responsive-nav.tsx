'use client'

import { cn } from "@/lib/utils"
import { forwardRef } from "react"

// Responsive navigation component with mobile-friendly behavior
export interface ResponsiveNavProps extends React.HTMLAttributes<HTMLElement> {
  collapsed?: boolean;
  onToggle?: () => void;
  showToggle?: boolean;
}

const ResponsiveNav = forwardRef<HTMLElement, ResponsiveNavProps>(
  ({ className, collapsed = true, onToggle, showToggle = true, children, ...props }, ref) => {
    return (
      <nav
        ref={ref}
        className={cn(
          "bg-card border-b border-border/50",
          className
        )}
        {...props}
      >
        <div className="container mx-auto px-4 flex items-center justify-between h-16">
          {/* Logo/Brand area */}
          <div className="flex items-center">
            {children}
          </div>
          
          {/* Mobile menu button */}
          {showToggle && (
            <button
              type="button"
              onClick={onToggle}
              className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              aria-label={collapsed ? "Open menu" : "Close menu"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {collapsed ? (
                  <>
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                )}
              </svg>
            </button>
          )}
          
          {/* Desktop navigation items - hidden on mobile */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {/* Navigation items would go here */}
          </div>
        </div>
        
        {/* Mobile navigation menu - shown when expanded */}
        <div className={cn(
          "md:hidden transition-all duration-300 ease-in-out overflow-hidden",
          collapsed ? "max-h-0" : "max-h-screen border-t border-border/50"
        )}>
          <div className="px-4 py-3 space-y-1">
            {/* Mobile navigation items would go here */}
          </div>
        </div>
      </nav>
    )
  }
)
ResponsiveNav.displayName = "ResponsiveNav"

export { ResponsiveNav }
