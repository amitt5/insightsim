"use client"

import { useState, useEffect, useCallback } from "react"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
} from "recharts"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CheckCircle2, Loader2, Clock,
  TrendingUp, Users, MessageSquare, Lightbulb,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { RefineryThumbnailResultsView } from "./RefineryThumbnailResultsView"
import { RefineryStaticAdResultsView } from "./RefineryStaticAdResultsView"
import { RunMoreButton } from "./RunMoreButton"

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
  content: string
  aggregate_score: number | null
  improvement_notes: string | null
  rag_recommendations: string | null
  status: string
}

interface IterUser {
  id: string
  name: string
  age: number | null
  gender: string | null
  profession: string | null
  bio: string | null
  score: number
  feedback: string
  personalizedContent: string | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface UGCContent {
  script: string
  image_url: string
  video_url: string
}

function parseUGCContent(content: string): UGCContent | null {
  try {
    const parsed = JSON.parse(content) as Record<string, unknown>
    if (
      typeof parsed.script === 'string' &&
      typeof parsed.video_url === 'string' &&
      typeof parsed.image_url === 'string'
    ) {
      return parsed as unknown as UGCContent
    }
    return null
  } catch {
    return null
  }
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
}

function scoreColor(score: number | null) {
  if (score === null) return "bg-muted"
  if (score >= 6.5) return "bg-emerald-500"
  if (score >= 5.5) return "bg-lime-400"
  if (score >= 4.5) return "bg-amber-400"
  if (score >= 3.5) return "bg-orange-400"
  return "bg-red-400"
}

// ─── Main component ───────────────────────────────────────────────────────────

export function RefineryResultsView({ campaignId }: { campaignId: string }) {
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [job, setJob] = useState<Job | null>(null)
  const [iterations, setIterations] = useState<Iteration[]>([])
  const [activeIteration, setActiveIteration] = useState(1)
  const [iterUsers, setIterUsers] = useState<IterUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCampaign = useCallback(async () => {
    const res = await fetch(`/api/refinery/campaigns/${campaignId}`)
    const data = await res.json()
    if (data.error) { setError(data.error); return }
    setCampaign(data.campaign)
    setJob(data.job)
    setIterations(data.iterations)
  }, [campaignId])

  useEffect(() => {
    fetchCampaign()
  }, [fetchCampaign])

  // Poll every 4s while job is running or pending
  useEffect(() => {
    if (!job) return
    if (job.status === "completed" || job.status === "failed") return
    const id = setInterval(fetchCampaign, 4000)
    return () => clearInterval(id)
  }, [job?.status, fetchCampaign])

  // Auto-advance active iteration to latest completed
  useEffect(() => {
    const completed = iterations.filter((it) => it.status === "completed")
    if (completed.length > 0) {
      setActiveIteration(completed[completed.length - 1].iteration_number)
    }
  }, [iterations.length])

  // Fetch users whenever active iteration changes
  useEffect(() => {
    const iter = iterations.find((it) => it.iteration_number === activeIteration)
    if (!iter || iter.status !== "completed") { setIterUsers([]); return }
    setLoadingUsers(true)
    fetch(`/api/refinery/campaigns/${campaignId}/iteration?n=${activeIteration}`)
      .then((r) => r.json())
      .then((data) => setIterUsers(data.users ?? []))
      .finally(() => setLoadingUsers(false))
  }, [activeIteration, campaignId, iterations])

  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-destructive text-sm">{error}</p>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (campaign.content_type === "ugc_thumbnail") {
    return <RefineryThumbnailResultsView campaignId={campaignId} />
  }

  if (campaign.content_type === "static_ad") {
    return <RefineryStaticAdResultsView campaignId={campaignId} />
  }

  const totalIterations = campaign.iterations
  const activeIter = iterations.find((it) => it.iteration_number === activeIteration)
  const isComplete = activeIter?.status === "completed"
  const completedCount = iterations.filter((it) => it.status === "completed").length

  const chartData = iterations
    .filter((it) => it.status === "completed" && it.aggregate_score !== null)
    .map((it) => ({ iteration: it.iteration_number, score: it.aggregate_score as number }))

  const feedbackLines = (() => {
    if (iterUsers.length === 0) return []
    const sorted = [...iterUsers].sort((a, b) => b.score - a.score)
    const top = sorted.slice(0, 2)
    const bottom = sorted.slice(-2).reverse()
    return [...top, ...bottom]
      .filter((u) => u.feedback)
      .map((u) => u.feedback)
  })()

  function iterStatus(n: number) {
    const iter = iterations.find((it) => it.iteration_number === n)
    if (!iter) return "pending"
    return iter.status
  }

  return (
    <TooltipProvider delayDuration={100}>
      <div className="bg-background">
        {/* Campaign info header */}
        <div className="border-b bg-background px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-semibold">{campaign.name}</h2>
              <Badge variant="secondary" className="capitalize">
                {campaign.content_type.replace(/_/g, " ")}
              </Badge>
              <StatusBadge status={campaign.status} />
            </div>

            <div className="shrink-0 flex flex-col items-end gap-2">
              {campaign.status === "completed" && (
                <RunMoreButton campaignId={campaignId} onComplete={fetchCampaign} />
              )}
              <p className="text-sm font-medium">
                {completedCount} of {totalIterations} iterations complete
              </p>
              <div className="mt-1.5 h-1.5 w-48 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${(completedCount / totalIterations) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <Tabs
          value={String(activeIteration)}
          onValueChange={(v) => {
            const n = Number(v)
            if (iterStatus(n) !== "pending") setActiveIteration(n)
          }}
        >
          {/* Tab bar */}
          <div className="border-b bg-background px-6">
            <div className="max-w-6xl mx-auto">
              <TabsList className="h-auto bg-transparent p-0 gap-0 rounded-none">
                {Array.from({ length: totalIterations }, (_, i) => {
                  const n = i + 1
                  const status = iterStatus(n)
                  const iter = iterations.find((it) => it.iteration_number === n)
                  const score = iter?.aggregate_score ?? null

                  return (
                    <TabsTrigger
                      key={n}
                      value={String(n)}
                      disabled={status === "pending"}
                      className={cn(
                        "relative rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium transition-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                        status === "running" && "text-amber-600 dark:text-amber-400",
                        status === "pending" && "opacity-50 cursor-default",
                      )}
                    >
                      <span className="flex items-center gap-1.5">
                        <span>#{n}</span>
                        {status === "completed" && score !== null && (
                          <span className="text-xs font-semibold text-muted-foreground">
                            {score.toFixed(1)}
                          </span>
                        )}
                        {status === "running" && <Loader2 className="h-3 w-3 animate-spin" />}
                        {status === "pending" && <Clock className="h-3 w-3" />}
                      </span>
                    </TabsTrigger>
                  )
                })}
              </TabsList>
            </div>
          </div>

          <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
            {isComplete && activeIter ? (
              <>
                <div className="grid grid-cols-2 gap-6">
                  {/* Left: content */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <h2 className="text-sm font-semibold">Iteration Prompt {activeIteration}</h2>
                    </div>
                    {activeIter.improvement_notes && (
                      <p className="text-xs text-muted-foreground italic border-l-2 border-muted pl-3">
                        {activeIter.improvement_notes}
                      </p>
                    )}
                    {(() => {
                      const ugc = parseUGCContent(activeIter.content)
                      if (ugc) {
                        return (
                          <div className="space-y-3">
                            <video
                              controls
                              src={ugc.video_url}
                              className="w-full rounded-lg border bg-black"
                              style={{ maxHeight: '360px' }}
                            />
                            <div className="rounded-lg border bg-muted/20 p-4">
                              <p className="text-xs text-muted-foreground font-medium mb-2">Ad Script</p>
                              <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans text-foreground">
                                {ugc.script}
                              </pre>
                            </div>
                          </div>
                        )
                      }
                      return (
                        <div className="rounded-lg border border-dashed bg-muted/10 p-5">
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Personalization Prompt</p>
                          <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans text-foreground">
                            {activeIter.content}
                          </pre>
                        </div>
                      )
                    })()}
                  </div>

                  {/* Right: score + feedback */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <h2 className="text-sm font-semibold">Aggregate Score</h2>
                      </div>
                      <AggregateScore
                        score={activeIter.aggregate_score}
                        iteration={activeIteration}
                        prevScore={iterations.find((it) => it.iteration_number === activeIteration - 1)?.aggregate_score ?? null}
                      />
                    </div>

                    <Separator />

                    <div>
                      <h2 className="text-sm font-semibold mb-3">Synthetic User Feedback</h2>
                      {feedbackLines.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Loading feedback…</p>
                      ) : (
                        <div className="space-y-2.5">
                          {feedbackLines.map((line, i) => (
                            <div key={i} className="flex gap-2.5 text-sm">
                              <span className="mt-0.5 shrink-0 h-4 w-4 rounded-full bg-muted flex items-center justify-center text-[10px] text-muted-foreground font-medium">
                                {i + 1}
                              </span>
                              <p className="text-muted-foreground leading-relaxed">{line}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {(() => {
                      if (!activeIter?.rag_recommendations) return null
                      let recs: { type: string; description: string; why: string }[] = []
                      try {
                        const parsed = JSON.parse(activeIter.rag_recommendations) as { recommendations?: { type: string; description: string; why: string }[] }
                        recs = parsed.recommendations ?? []
                      } catch { return null }
                      if (recs.length === 0) return null
                      return (
                        <>
                          <Separator />
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Lightbulb className="h-4 w-4 text-amber-500" />
                              <h2 className="text-sm font-semibold">How to improve this campaign</h2>
                            </div>
                            <p className="text-xs text-muted-foreground mb-3">
                              Add this content to your RAG data to give the AI more to work with:
                            </p>
                            <div className="space-y-2.5">
                              {recs.map((rec, i) => (
                                <div key={i} className="rounded-lg border bg-amber-50/50 dark:bg-amber-950/20 p-3 space-y-1">
                                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">{rec.type}</p>
                                  <p className="text-xs leading-relaxed">{rec.description}</p>
                                  <p className="text-xs text-muted-foreground italic">Why: {rec.why}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </div>

                <Separator />

                {/* Synthetic user grid */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <h2 className="text-sm font-semibold">
                      Synthetic Users — Iteration {activeIteration}
                    </h2>
                    <span className="text-xs text-muted-foreground">
                      ({iterUsers.length} users · hover for details)
                    </span>
                  </div>

                  {loadingUsers ? (
                    <div className="flex items-center gap-2 py-4">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Loading users…</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-6 gap-2">
                      {iterUsers.map((user) => (
                        <Tooltip key={user.id}>
                          <TooltipTrigger asChild>
                            <div className={cn(
                              "aspect-square rounded-lg flex flex-col items-center justify-center gap-1 cursor-default select-none transition-all hover:scale-105 hover:shadow-md",
                              scoreColor(user.score)
                            )}>
                              <span className="text-sm font-bold text-white">{initials(user.name)}</span>
                              <span className="text-xs font-semibold text-white">{user.score.toFixed(1)}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" align="center" avoidCollisions={true} collisionPadding={12} className="max-w-[300px] p-3 space-y-2 max-h-[420px] overflow-y-auto">
                            <div>
                              <p className="font-semibold text-sm">{user.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {[user.age, user.gender, user.profession].filter(Boolean).join(" · ")}
                              </p>
                            </div>
                            {user.bio && <p className="text-xs leading-relaxed">{user.bio}</p>}
                            <Separator />
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">Score</span>
                              <span className="text-sm font-bold">{user.score.toFixed(1)} / 10</span>
                            </div>
                            {user.feedback && (
                              <p className="text-xs text-muted-foreground italic">"{user.feedback}"</p>
                            )}
                            {user.personalizedContent && (
                              <>
                                <Separator />
                                <div>
                                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Their message</p>
                                  <p className="text-xs leading-relaxed whitespace-pre-wrap">
                                    {user.personalizedContent.length > 300
                                      ? user.personalizedContent.slice(0, 300) + "…"
                                      : user.personalizedContent}
                                  </p>
                                </div>
                              </>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
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
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                {iterStatus(activeIteration) === "running" ? (
                  <>
                    <Loader2 className="h-8 w-8 text-amber-500 animate-spin mb-3" />
                    <p className="text-sm font-medium">Iteration {activeIteration} is running…</p>
                    <p className="text-xs text-muted-foreground mt-1">Synthetic users are evaluating this version.</p>
                  </>
                ) : job?.status === "pending" ? (
                  <>
                    <Clock className="h-8 w-8 text-muted-foreground mb-3 animate-pulse" />
                    <p className="text-sm font-medium">Campaign is queued</p>
                    <p className="text-xs text-muted-foreground mt-1">Starting shortly…</p>
                  </>
                ) : (
                  <>
                    <Clock className="h-8 w-8 text-muted-foreground mb-3" />
                    <p className="text-sm font-medium">Iteration {activeIteration} hasn't started yet</p>
                    <p className="text-xs text-muted-foreground mt-1">It will run after previous iterations complete.</p>
                  </>
                )}
              </div>
            )}

            {chartData.length > 1 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <h2 className="text-sm font-semibold">Score Progression</h2>
                  </div>
                  <ProgressionChart
                    data={chartData}
                    activeIteration={activeIteration}
                    onDotClick={(n) => setActiveIteration(n)}
                  />
                </div>
              </>
            )}
          </div>
        </Tabs>
      </div>
    </TooltipProvider>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === "completed") {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-full px-2.5 py-0.5">
        <CheckCircle2 className="h-3 w-3" />
        Completed
      </span>
    )
  }
  if (status === "running") {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-full px-2.5 py-0.5">
        <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
        Running
      </span>
    )
  }
  if (status === "failed") {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-full px-2.5 py-0.5">
        Failed
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground border rounded-full px-2.5 py-0.5">
      <Clock className="h-3 w-3" />
      Pending
    </span>
  )
}

function AggregateScore({
  score, iteration, prevScore,
}: {
  score: number | null
  iteration: number
  prevScore: number | null
}) {
  if (score === null) return null

  const radius = 36
  const circumference = 2 * Math.PI * radius
  const dashoffset = circumference * (1 - score / 10)
  const ringColor =
    score >= 6.5 ? "#10b981" :
    score >= 5.5 ? "#84cc16" :
    score >= 4.5 ? "#f59e0b" : "#ef4444"
  const delta = prevScore !== null ? score - prevScore : null

  return (
    <div className="flex items-center gap-5">
      <div className="relative flex items-center justify-center">
        <svg width="96" height="96" className="-rotate-90">
          <circle cx="48" cy="48" r={radius} fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/50" />
          <circle cx="48" cy="48" r={radius} fill="none" stroke={ringColor} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={dashoffset}
            style={{ transition: "stroke-dashoffset 0.6s ease" }} />
        </svg>
        <div className="absolute text-center">
          <span className="text-xl font-bold tabular-nums leading-none">{score.toFixed(1)}</span>
          <span className="block text-[10px] text-muted-foreground">/ 10</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-sm font-medium">
          {score >= 6.5 ? "Strong result" : score >= 5.5 ? "Improving" : score >= 4.5 ? "Mixed signals" : "Needs work"}
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-[180px]">
          {score >= 6.5
            ? "Most synthetic users found this version relevant and compelling."
            : score >= 5.5
            ? "Good progress — users are engaging but still have key objections."
            : score >= 4.5
            ? "Halfway there. Pain framing is landing but CTA needs work."
            : "Opener and value prop aren't connecting yet. Keep iterating."}
        </p>
        {iteration > 1 && delta !== null && (
          <p className={cn("text-xs font-medium", delta >= 0 ? "text-emerald-600" : "text-destructive")}>
            {delta >= 0 ? "+" : ""}{delta.toFixed(1)} vs. iteration {iteration - 1}
          </p>
        )}
      </div>
    </div>
  )
}

function ProgressionChart({
  data, activeIteration, onDotClick,
}: {
  data: { iteration: number; score: number }[]
  activeIteration: number
  onDotClick: (n: number) => void
}) {
  return (
    <div className="rounded-lg border bg-muted/10 p-4">
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="iteration" tickFormatter={(v) => `#${v}`} tick={{ fontSize: 12 }} />
          <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={{ fontSize: 12 }} />
          <RechartsTooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const d = payload[0].payload as { iteration: number; score: number }
              return (
                <div className="rounded-md border bg-popover px-3 py-2 text-sm shadow-md">
                  <p className="font-medium">Iteration #{d.iteration}</p>
                  <p className="text-muted-foreground">Score: <span className="font-semibold text-foreground">{d.score.toFixed(1)}</span></p>
                </div>
              )
            }}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="hsl(var(--primary))"
            strokeWidth={2.5}
            dot={(props: { cx: number; cy: number; payload: { iteration: number; score: number } }) => {
              const { cx, cy, payload } = props
              const isActive = payload.iteration === activeIteration
              return (
                <circle key={payload.iteration} cx={cx} cy={cy} r={isActive ? 6 : 4}
                  fill={isActive ? "hsl(var(--primary))" : "hsl(var(--background))"}
                  stroke="hsl(var(--primary))" strokeWidth={2}
                  style={{ cursor: "pointer" }}
                  onClick={() => onDotClick(payload.iteration)} />
              )
            }}
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-xs text-muted-foreground text-center mt-1">Click a point to jump to that iteration</p>
    </div>
  )
}
