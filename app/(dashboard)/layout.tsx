import type React from "react"
import { Sidebar } from "@/components/sidebar"
import { UserNav } from "@/components/user-nav"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-end border-b bg-white px-6">
          <UserNav />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
