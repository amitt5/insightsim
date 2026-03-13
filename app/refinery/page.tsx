"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FlaskConical, Plus } from "lucide-react"

export default function RefineryDashboard() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5" />
          <h1 className="text-lg font-semibold">Refinery</h1>
        </div>
        <Button asChild>
          <Link href="/refinery/new">
            <Plus className="h-4 w-4 mr-1.5" />
            New Campaign
          </Link>
        </Button>
      </header>

      <main className="px-8 py-12 flex flex-col items-center justify-center text-center">
        <FlaskConical className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">No campaigns yet</h2>
        <p className="text-muted-foreground text-sm max-w-sm mb-6">
          Refinery helps you optimize marketing copy through iterative synthetic user testing.
          Create your first campaign to get started.
        </p>
        <Button asChild>
          <Link href="/refinery/new">
            <Plus className="h-4 w-4 mr-1.5" />
            New Campaign
          </Link>
        </Button>
      </main>
    </div>
  )
}
