"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FlaskConical, Plus } from "lucide-react"

interface Campaign {
  id: string
  name: string
  content_type: string
  status: string
  iterations: number
  users_per_iter: number
  created_at: string
}

const STATUS_LABEL: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  draft:     { label: "Draft",     variant: "outline" },
  pending:   { label: "Pending",   variant: "secondary" },
  running:   { label: "Running",   variant: "default" },
  completed: { label: "Completed", variant: "secondary" },
  failed:    { label: "Failed",    variant: "destructive" },
}

export default function RefineryDashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/refinery/campaigns")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error)
        setCampaigns(data.campaigns)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

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

      <main className="px-8 py-10">
        {loading && (
          <p className="text-sm text-muted-foreground text-center mt-20">Loading campaigns…</p>
        )}

        {!loading && error && (
          <p className="text-sm text-destructive text-center mt-20">{error}</p>
        )}

        {!loading && !error && campaigns.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center mt-20">
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
          </div>
        )}

        {!loading && !error && campaigns.length > 0 && (
          <div className="max-w-3xl mx-auto space-y-3">
            {campaigns.map((c) => {
              const status = STATUS_LABEL[c.status] ?? { label: c.status, variant: "outline" as const }
              return (
                <Link
                  key={c.id}
                  href={c.status === "draft" ? `/refinery/new?id=${c.id}` : `/refinery/${c.id}`}
                  className="flex items-center justify-between rounded-lg border px-5 py-4 hover:bg-accent transition-colors"
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {c.content_type.replace(/_/g, " ")} · {c.iterations} iterations · {c.users_per_iter} users
                    </p>
                  </div>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
