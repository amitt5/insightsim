"use client"

import Link from "next/link"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, FileText, Settings, BarChart, MessageSquare, ChevronLeft, ChevronRight, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SidebarProps {
  className?: string
  activePath?: string
}

export function Sidebar({ className, activePath = "" }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const links = [
    // { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/simulations", label: "Simulations", icon: MessageSquare },
    { href: "/personas", label: "Personas", icon: Users },
    { href: "/analysis", label: "Analysis", icon: TrendingUp },
    // { href: "/reports", label: "Reports", icon: FileText },
    // { href: "/analytics", label: "Analytics", icon: BarChart },
    { href: "/settings", label: "Settings", icon: Settings },
  ]

  return (
    <div className="relative">
      <div className={cn(
        "flex h-screen flex-col bg-white border-r transition-all duration-300 relative",
        isCollapsed ? "w-20" : "w-64",
        className
      )}>
        <div className="flex h-16 items-center border-b px-4 justify-between">
          <Link href="/simulations" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-r from-purple-500 to-violet-600">
              <span className="text-lg font-bold text-white">IS</span>
            </div>
            {!isCollapsed && <span className="text-xl font-bold">Maira</span>}
          </Link>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {links.map((link) => {
            const isActive = activePath === link.href
            const Icon = link.icon

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                  isActive ? "bg-primary/10 text-primary" : "text-gray-700 hover:bg-gray-100",
                  isCollapsed && "justify-center"
                )}
                title={isCollapsed ? link.label : undefined}
              >
                <Icon className="h-5 w-5" />
                {!isCollapsed && link.label}
              </Link>
            )
          })}
        </nav>
        <Button
          variant="ghost"
          size="sm"
          className="absolute -right-3 top-20 z-50 h-6 w-6 rounded-full bg-white p-0 hover:bg-gray-100 border shadow-sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}
