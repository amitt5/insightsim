import Link from "next/link"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, FileText, Settings, BarChart, MessageSquare } from "lucide-react"

interface SidebarProps {
  className?: string
  activePath?: string
}

export function Sidebar({ className, activePath = "" }: SidebarProps) {
  const links = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/simulations", label: "Simulations", icon: MessageSquare },
    { href: "/personas", label: "Personas", icon: Users },
    { href: "/reports", label: "Reports", icon: FileText },
    { href: "/analytics", label: "Analytics", icon: BarChart },
    { href: "/settings", label: "Settings", icon: Settings },
  ]

  return (
    <div className={cn("flex h-full w-64 flex-col border-r bg-white", className)}>
      <div className="flex h-16 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-r from-purple-500 to-violet-600">
            <span className="text-lg font-bold text-white">IS</span>
          </div>
          <span className="text-xl font-bold">InsightSim</span>
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
              )}
            >
              <Icon className="h-5 w-5" />
              {link.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
