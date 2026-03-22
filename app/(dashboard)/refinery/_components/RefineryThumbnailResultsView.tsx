"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle2, Clock, Images } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Campaign {
  id: string
  name: string
  content_type: string
  status: string
  iterations: number
  users_per_iter: number
}

interface Job {
  status: string
  current_iteration: number
  total_iterations: number
  error: string | null
}

interface Iteration {
  id: string
  iteration_number: number
  content: string        // image URL for thumbnail campaigns
  aggregate_score: number | null
  status: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function scoreBorderColor(score: number | null) {
  if (score === null) return "border-muted"
  if (score >= 6.5) return "border-emerald-500"
  if (score >= 5.5) return "border-lime-400"
  if (score >= 4.5) return "border-amber-400"
  if (score >= 3.5) return "border-orange-400"
  return "border-red-400"
}

function scoreBadgeColor(score: number | null) {
  if (score === null) return "bg-muted text-muted-foreground"
  if (score >= 6.5) return "bg-emerald-500 text-white"
  if (score >= 5.5) return "bg-lime-400 text-white"
  if (score >= 4.5) return "bg-amber-400 text-white"
  if (score >= 3.5) return "bg-orange-400 text-white"
  return "bg-red-400 text-white"
}

// ─── Main component ───────────────────────────────────────────────────────────

export function RefineryThumbnailResultsView({ campaignId }: { campaignId: string }) {
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [job, setJob] = useState<Job | null>(null)
  const [iterations, setIterations] = useState<Iteration[]>([])
  const [iterFeedback, setIterFeedback] = useState<Record<string, string[]>>({})
  const [error, setError] = useState<string | null>(null)

  const fetchCampaign = useCallback(async () => {
    const res = await fetch(`/api/refinery/campaigns/${campaignId}`)
    const data = await res.json()
    if (data.error) { setError(data.error); return }
    setCampaign(data.campaign)
    setJob(data.job)
    setIterations(data.iterations)
  }, [campaignId])

  useEffect(() => { fetchCampaign() }, [fetchCampaign])

  // Poll every 4s while running
  useEffect(() => {
    if (!job) return
    if (job.status === "completed" || job.status === "failed") return
    const id = setInterval(fetchCampaign, 4000)
    return () => clearInterval(id)
  }, [job?.status, fetchCampaign])

  // Fetch top feedback for each completed iteration
  useEffect(() => {
    const completed = iterations.filter((it) => it.status === "completed")
    completed.forEach((it) => {
      if (iterFeedback[it.id]) return // already fetched
      fetch(`/api/refinery/campaigns/${campaignId}/iteration?n=${it.iteration_number}`)
        .then((r) => r.json())
        .then((data) => {
          const users = (data.users ?? []) as { score: number; feedback: string }[]
          const sorted = [...users].sort((a, b) => b.score - a.score)
          const top = sorted.slice(0, 2).map((u) => u.feedback).filter(Boolean)
          setIterFeedback((prev) => ({ ...prev, [it.id]: top }))
        })
    })
  }, [iterations, campaignId, iterFeedback])

  if (error) return (
    <div className="flex items-center justify-center py-16">
      <p className="text-destructive text-sm">{error}</p>
    </div>
  )

  if (!campaign) return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )

  const completedCount = iterations.filter((it) => it.status === "completed").length
  const totalImages = campaign.iterations
  const isRunning = job?.status === "running" || job?.status === "pending"

  // Sort completed by score desc, keep pending/running at end
  const sorted = [
    ...iterations.filter((it) => it.status === "completed").sort(
      (a, b) => (b.aggregate_score ?? 0) - (a.aggregate_score ?? 0)
    ),
    ...iterations.filter((it) => it.status !== "completed"),
  ]

  return (
    <TooltipProvider delayDuration={100}>
      <div className="bg-background">
        {/* Header */}
        <div className="border-b bg-background px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-semibold">{campaign.name}</h2>
              <Badge variant="secondary">UGC Thumbnail</Badge>
              <StatusBadge status={campaign.status} />
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-medium">
                {completedCount} of {totalImages} images tested
              </p>
              <div className="mt-1.5 h-1.5 w-48 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${(completedCount / totalImages) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-6">
          {/* Running state banner */}
          {isRunning && (
            <div className="flex items-center gap-2 mb-6 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              Generating and testing images… {completedCount} of {totalImages} done. Results appear as they complete.
            </div>
          )}

          {iterations.length === 0 && isRunning && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Images className="h-10 w-10 text-muted-foreground mb-3 animate-pulse" />
              <p className="text-sm font-medium">Generating images…</p>
              <p className="text-xs text-muted-foreground mt-1">This may take a moment.</p>
            </div>
          )}

          {/* Image grid — sorted by score desc */}
          {sorted.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {sorted.map((iter) => {
                const isComplete = iter.status === "completed"
                const isRunningIter = iter.status === "running"
                const feedback = iterFeedback[iter.id] ?? []

                return (
                  <Tooltip key={iter.id}>
                    <TooltipTrigger asChild>
                      <div className={cn(
                        "relative rounded-lg border-2 overflow-hidden aspect-[2/3] cursor-default transition-all hover:scale-105 hover:shadow-lg",
                        isComplete ? scoreBorderColor(iter.aggregate_score) : "border-muted"
                      )}>
                        {/* Image */}
                        <img
                          src={iter.content}
                          alt={`Thumbnail ${iter.iteration_number}`}
                          className="w-full h-full object-cover"
                        />

                        {/* Score badge */}
                        {isComplete && iter.aggregate_score !== null && (
                          <div className={cn(
                            "absolute top-1.5 right-1.5 rounded-full px-2 py-0.5 text-xs font-bold shadow",
                            scoreBadgeColor(iter.aggregate_score)
                          )}>
                            {iter.aggregate_score.toFixed(1)}
                          </div>
                        )}

                        {/* Running overlay */}
                        {isRunningIter && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Loader2 className="h-6 w-6 text-white animate-spin" />
                          </div>
                        )}

                        {/* Image number */}
                        <div className="absolute bottom-1.5 left-1.5 bg-black/50 text-white text-[10px] font-medium rounded px-1.5 py-0.5">
                          #{iter.iteration_number}
                        </div>
                      </div>
                    </TooltipTrigger>
                    {isComplete && (
                      <TooltipContent side="right" className="max-w-[220px] p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold">Thumbnail #{iter.iteration_number}</span>
                          <span className={cn(
                            "text-xs font-bold rounded-full px-2 py-0.5",
                            scoreBadgeColor(iter.aggregate_score)
                          )}>
                            {iter.aggregate_score?.toFixed(1)} / 10
                          </span>
                        </div>
                        {feedback.length > 0 && (
                          <div className="space-y-1.5">
                            {feedback.map((f, i) => (
                              <p key={i} className="text-xs text-muted-foreground italic">"{f}"</p>
                            ))}
                          </div>
                        )}
                      </TooltipContent>
                    )}
                  </Tooltip>
                )
              })}
            </div>
          )}

          {/* Score legend */}
          {completedCount > 0 && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-6">
              <span>Score legend:</span>
              {[
                { color: "bg-red-400", label: "< 3.5" },
                { color: "bg-orange-400", label: "3.5–4.5" },
                { color: "bg-amber-400", label: "4.5–5.5" },
                { color: "bg-lime-400", label: "5.5–6.5" },
                { color: "bg-emerald-500", label: "6.5+" },
              ].map(({ color, label }) => (
                <span key={label} className="flex items-center gap-1.5">
                  <span className={cn("h-2.5 w-2.5 rounded-sm", color)} />
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === "completed") return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-full px-2.5 py-0.5">
      <CheckCircle2 className="h-3 w-3" />Completed
    </span>
  )
  if (status === "running") return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-full px-2.5 py-0.5">
      <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />Running
    </span>
  )
  if (status === "failed") return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-full px-2.5 py-0.5">
      Failed
    </span>
  )
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground border rounded-full px-2.5 py-0.5">
      <Clock className="h-3 w-3" />Pending
    </span>
  )
}
