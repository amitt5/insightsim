'use client'

import { cn } from "@/lib/utils"
import { forwardRef } from "react"

// Enhanced sidebar navigation components with refined styling and states
export interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

const Sidebar = forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col h-full w-64 bg-card border-r border-border/50",
        "transition-all duration-300 ease-in-out",
        className
      )}
      {...props}
    />
  )
)
Sidebar.displayName = "Sidebar"

export interface SidebarHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const SidebarHeader = forwardRef<HTMLDivElement, SidebarHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex h-14 items-center border-b border-border/50 px-4",
        className
      )}
      {...props}
    />
  )
)
SidebarHeader.displayName = "SidebarHeader"

export interface SidebarNavProps extends React.HTMLAttributes<HTMLDivElement> {}

const SidebarNav = forwardRef<HTMLDivElement, SidebarNavProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex-1 overflow-auto py-2",
        className
      )}
      {...props}
    />
  )
)
SidebarNav.displayName = "SidebarNav"

export interface SidebarItemProps extends React.HTMLAttributes<HTMLAnchorElement> {
  active?: boolean;
  icon?: React.ReactNode;
}

const SidebarItem = forwardRef<HTMLAnchorElement, SidebarItemProps>(
  ({ className, active, icon, children, ...props }, ref) => (
    <a
      ref={ref}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 typography-body-small",
        "transition-colors duration-200",
        "hover:bg-primary/5 hover:text-primary",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        active ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground",
        className
      )}
      {...props}
    >
      {icon && <span className="text-current">{icon}</span>}
      <span>{children}</span>
    </a>
  )
)
SidebarItem.displayName = "SidebarItem"

export interface SidebarSectionProps extends React.HTMLAttributes<HTMLDivElement> {}

const SidebarSection = forwardRef<HTMLDivElement, SidebarSectionProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "px-3 py-2",
        className
      )}
      {...props}
    />
  )
)
SidebarSection.displayName = "SidebarSection"

export interface SidebarSectionTitleProps extends React.HTMLAttributes<HTMLDivElement> {}

const SidebarSectionTitle = forwardRef<HTMLDivElement, SidebarSectionTitleProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "mb-2 px-2 typography-overline text-xs font-medium text-muted-foreground",
        className
      )}
      {...props}
    />
  )
)
SidebarSectionTitle.displayName = "SidebarSectionTitle"

export interface SidebarFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const SidebarFooter = forwardRef<HTMLDivElement, SidebarFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "border-t border-border/50 p-4",
        className
      )}
      {...props}
    />
  )
)
SidebarFooter.displayName = "SidebarFooter"

export {
  Sidebar,
  SidebarHeader,
  SidebarNav,
  SidebarItem,
  SidebarSection,
  SidebarSectionTitle,
  SidebarFooter
}
