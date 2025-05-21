'use client'

import { cn } from "@/lib/utils"
import { forwardRef } from "react"

// Responsive sidebar component with mobile collapsible behavior
export interface ResponsiveSidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  isOpen?: boolean;
  onToggle?: () => void;
  showToggle?: boolean;
}

const ResponsiveSidebar = forwardRef<HTMLDivElement, ResponsiveSidebarProps>(
  ({ className, isOpen = false, onToggle, showToggle = true, children, ...props }, ref) => {
    return (
      <>
        {/* Mobile overlay when sidebar is open */}
        {isOpen && (
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
            onClick={onToggle}
          />
        )}
        
        {/* Sidebar */}
        <div
          ref={ref}
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border/50",
            "transition-transform duration-300 ease-in-out",
            "md:translate-x-0 md:static md:z-0",
            isOpen ? "translate-x-0" : "-translate-x-full",
            className
          )}
          {...props}
        >
          {children}
        </div>
        
        {/* Toggle button for mobile */}
        {showToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="fixed bottom-4 left-4 z-50 md:hidden p-2 rounded-full bg-primary text-primary-foreground shadow-md"
            aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
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
              {isOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        )}
      </>
    )
  }
)
ResponsiveSidebar.displayName = "ResponsiveSidebar"

export { ResponsiveSidebar }
