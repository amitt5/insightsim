'use client'

import { cn } from "@/lib/utils"
import { forwardRef } from "react"

// Table skeleton loader component for data loading states
export interface TableSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  rows?: number;
  columns?: number;
  header?: boolean;
}

const TableSkeleton = forwardRef<HTMLDivElement, TableSkeletonProps>(
  ({ className, rows = 5, columns = 4, header = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "w-full overflow-auto",
          className
        )}
        {...props}
      >
        <table className="w-full caption-bottom text-sm border-collapse">
          {header && (
            <thead className="border-b border-border/50 bg-muted/30">
              <tr>
                {Array.from({ length: columns }).map((_, i) => (
                  <th key={i} className="h-12 px-4 text-left align-middle">
                    <div className="h-4 w-20 bg-muted/60 rounded animate-pulse" />
                  </th>
                ))}
              </tr>
            </thead>
          )}
          
          <tbody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr 
                key={rowIndex} 
                className="border-b border-border/30"
                style={{ animationDelay: `${rowIndex * 100}ms` }}
              >
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className="p-4 align-middle">
                    <div 
                      className="h-4 bg-muted/60 rounded animate-pulse"
                      style={{ 
                        width: `${Math.max(50, Math.min(90, 70 + Math.random() * 30))}%`,
                        animationDelay: `${(rowIndex * columns + colIndex) * 50}ms`
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }
)
TableSkeleton.displayName = "TableSkeleton"

export { TableSkeleton }
