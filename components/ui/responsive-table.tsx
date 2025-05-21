'use client'

import { cn } from "@/lib/utils"
import { forwardRef } from "react"

// Responsive table component with mobile-friendly views
export interface ResponsiveTableProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'cards' | 'stacked';
}

const ResponsiveTable = forwardRef<HTMLDivElement, ResponsiveTableProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "w-full",
          {
            "overflow-auto": variant === 'default',
            "block sm:overflow-auto": variant === 'stacked',
            "block": variant === 'cards',
          },
          className
        )}
        data-variant={variant}
        {...props}
      >
        {children}
      </div>
    )
  }
)
ResponsiveTable.displayName = "ResponsiveTable"

// Table components with responsive styling
const Table = forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <table
    ref={ref}
    className={cn(
      "w-full caption-bottom text-sm",
      "[&[data-variant=stacked]_tbody_tr]:block [&[data-variant=stacked]_tbody_tr]:border-b [&[data-variant=stacked]_tbody_tr]:py-2 sm:[&[data-variant=stacked]_tbody_tr]:table-row",
      "[&[data-variant=stacked]_tbody_td]:block [&[data-variant=stacked]_tbody_td]:text-left [&[data-variant=stacked]_tbody_td]:py-1 sm:[&[data-variant=stacked]_tbody_td]:table-cell",
      "[&[data-variant=stacked]_tbody_td]:before:content-[attr(data-label)] [&[data-variant=stacked]_tbody_td]:before:inline-block [&[data-variant=stacked]_tbody_td]:before:w-1/3 [&[data-variant=stacked]_tbody_td]:before:font-medium sm:[&[data-variant=stacked]_tbody_td]:before:content-none",
      "[&[data-variant=cards]_thead]:hidden",
      "[&[data-variant=cards]_tbody_tr]:block [&[data-variant=cards]_tbody_tr]:rounded-lg [&[data-variant=cards]_tbody_tr]:border [&[data-variant=cards]_tbody_tr]:p-4 [&[data-variant=cards]_tbody_tr]:mb-4",
      "[&[data-variant=cards]_tbody_td]:block [&[data-variant=cards]_tbody_td]:text-left [&[data-variant=cards]_tbody_td]:py-1",
      "[&[data-variant=cards]_tbody_td]:before:content-[attr(data-label)] [&[data-variant=cards]_tbody_td]:before:inline-block [&[data-variant=cards]_tbody_td]:before:w-1/3 [&[data-variant=cards]_tbody_td]:before:font-medium",
      className
    )}
    {...props}
  />
))
Table.displayName = "Table"

const TableHeader = forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn(
      "border-b border-border/50 bg-muted/30",
      "[&_tr]:border-b-0",
      className
    )}
    {...props}
  />
))
TableHeader.displayName = "TableHeader"

const TableBody = forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn(
      "[&_tr:last-child]:border-0",
      className
    )}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableRow = forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b border-border/30 transition-colors",
      "hover:bg-muted/30",
      "data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle typography-label",
      "text-muted-foreground font-medium",
      "[&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement> & { label?: string }
>(({ className, label, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "p-4 align-middle typography-body-small",
      "[&:has([role=checkbox])]:pr-0",
      className
    )}
    data-label={label}
    {...props}
  />
))
TableCell.displayName = "TableCell"

export {
  ResponsiveTable,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
}
