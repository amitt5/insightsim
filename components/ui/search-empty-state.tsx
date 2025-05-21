'use client'

import { cn } from "@/lib/utils"
import { forwardRef } from "react"

// Search empty state component
export interface SearchEmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  query?: string;
  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
}

const SearchEmptyState = forwardRef<HTMLDivElement, SearchEmptyStateProps>(
  ({ className, query, suggestions, onSuggestionClick, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center text-center p-8",
          className
        )}
        {...props}
      >
        <div className="mb-4 text-muted-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            <line x1="8" y1="11" x2="14" y2="11"></line>
          </svg>
        </div>
        
        <h3 className="text-lg font-medium mb-2">No results found</h3>
        
        {query && (
          <p className="text-muted-foreground mb-4">
            No results found for "<span className="font-medium">{query}</span>"
          </p>
        )}
        
        {!query && (
          <p className="text-muted-foreground mb-4">
            We couldn't find any matching results
          </p>
        )}
        
        {suggestions && suggestions.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Try searching for:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => onSuggestionClick?.(suggestion)}
                  className="px-3 py-1 text-sm bg-muted rounded-full hover:bg-muted/80 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }
)
SearchEmptyState.displayName = "SearchEmptyState"

export { SearchEmptyState }
