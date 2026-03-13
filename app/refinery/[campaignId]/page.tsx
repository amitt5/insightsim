"use client"

import { useState } from "react"
import Link from "next/link"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Dot,
} from "recharts"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  FlaskConical,
  Mail,
  CheckCircle2,
  Loader2,
  Clock,
  ChevronLeft,
  TrendingUp,
  Users,
  MessageSquare,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Fake data ────────────────────────────────────────────────────────────────

const CAMPAIGN = {
  name: "Q2 Cold Email — SaaS Founders",
  contentType: "Cold Email",
  status: "running" as "running" | "completed",
  totalIterations: 6,
  completedIterations: 4,
}

/** Displayed scores — compressed scale per spec. Increments shrink as score rises. */
const ITERATION_SCORES = [4.2, 5.1, 5.9, 6.5, null, null] // null = not yet complete

const ITERATION_CONTENT: Record<number, string> = {
  1: `Subject: Quick question about your outbound

Hi {{first_name}},

I noticed you're heading up growth at {{company}}. We help B2B SaaS teams improve their outbound conversion rates.

If that's something you're focused on, I'd love to show you how we do it.

Worth a 15-minute call this week?

— Alex`,

  2: `Subject: Your outbound team is probably leaving deals on the table

Hi {{first_name}},

Most Series A–B teams I talk to are running the same playbook: big lists, generic copy, low reply rates.

We built a tool that fixes the personalization bottleneck — not with mail merge fields, but with real research-backed messaging for every prospect.

Teams like Rippling and Deel use it to get 3–5× more replies from the same list.

Open to a 15-min chat this week?

— Alex`,

  3: `Subject: The reply rate problem at {{company}}

Hi {{first_name}},

You've probably noticed it: outbound sequences that looked great in the deck are delivering 1–2% reply rates in practice.

The usual fix is "send more volume" — which burns your domain and your team.

We take a different angle: AI-grounded personalization that actually reads like a human wrote it for that specific prospect. No mail merge theater.

Curious if it's worth a look — happy to show you what we pulled together for a company similar to {{company}}.

15 minutes this week?

— Alex`,

  4: `Subject: I looked into {{company}}'s outbound — here's what I found

Hi {{first_name}},

I dug into your recent LinkedIn activity and noticed {{company}} is scaling the sales team fast. That usually means outbound volume goes up and reply rates go down.

We've helped three other Series B SaaS companies (Reclaim, Attio, Ramp's partner team) fix exactly that — cutting prospecting time by 60% while tripling meaningful reply rates.

The trick isn't sending more. It's making each send feel like it couldn't have been sent to anyone else.

Worth 20 minutes to show you what we built? I'll bring a live demo using your actual prospect list.

— Alex`,
}

const ITERATION_FEEDBACK: Record<number, string[]> = {
  1: [
    "Opener felt generic — 'I noticed you're heading up growth' tells me nothing specific about why you reached out to me.",
    "CTA asks for 15 minutes but gives me no reason to say yes. What am I getting out of this call?",
    "The value prop is completely undefined. 'Improve outbound conversion rates' could mean anything.",
    "This reads like a template. I get five of these a week and they all sound the same.",
  ],
  2: [
    "The hook is sharper but 'leaving deals on the table' is still a cliché.",
    "Rippling and Deel namedrop helps — but feels like it could be fabricated social proof.",
    "CTA is still too generic. '15-min chat' with no agenda or hook.",
    "Better than the first version. At least there's a mechanism (research-backed vs. mail merge).",
  ],
  3: [
    "The reply rate framing finally landed — I knew immediately what problem this solves.",
    "'Mail merge theater' is a great phrase. That's exactly how I think about it.",
    "The domain burning line hit hard — that's a real fear I have.",
    "CTA still weak. 'Curious if it's worth a look' is hedging too much.",
  ],
  4: [
    "This actually felt personal. The LinkedIn research hook made me stop skimming.",
    "The three company names are credible — those are companies I respect.",
    "Live demo with my prospect list — now I actually want to say yes.",
    "'Making each send feel like it couldn't have been sent to anyone else' — that's the whole product in a sentence.",
  ],
}

interface SyntheticUser {
  id: number
  initials: string
  name: string
  age: number
  gender: string
  profession: string
  bio: string
  scores: (number | null)[] // per iteration, null = not complete
  feedback: string[]        // per iteration (only for completed)
}

const SYNTHETIC_USERS: SyntheticUser[] = [
  { id: 1, initials: "MC", name: "Marcus Chen", age: 38, gender: "Male", profession: "VP of Growth, Series B SaaS", bio: "Data-driven operator who's been burned by overpromising vendors. Skims cold email in under 5 seconds.", scores: [3.8, 5.2, 6.1, 6.9, null, null], feedback: ["Generic.", "Decent hook.", "Resonated.", "Finally landed."] },
  { id: 2, initials: "SR", name: "Shreya Rajan", age: 32, gender: "Female", profession: "Head of Marketing, PLG startup", bio: "Product-led growth evangelist skeptical of outbound-first thinking. High bar for relevance.", scores: [4.5, 4.9, 5.7, 6.2, null, null], feedback: ["Too salesy.", "Still generic.", "Better framing.", "Good, not perfect."] },
  { id: 3, initials: "TW", name: "Tom Wilcox", age: 44, gender: "Male", profession: "CEO, bootstrapped SaaS", bio: "Self-funded, highly skeptical of anything that sounds like VC vanity metrics. Respects bluntness.", scores: [3.2, 5.5, 5.8, 6.8, null, null], feedback: ["Delete.", "Mildly curious.", "Getting warmer.", "Would reply."] },
  { id: 4, initials: "AP", name: "Amara Patel", age: 29, gender: "Female", profession: "Growth Lead, Series A", bio: "Early in her role, eager to prove ROI. Responds well to specific numbers and peer social proof.", scores: [5.1, 5.8, 6.4, 7.1, null, null], feedback: ["No numbers.", "Social proof helps.", "Strong pain hook.", "Would book."] },
  { id: 5, initials: "JL", name: "Jonas Lee", age: 36, gender: "Male", profession: "Founder & CEO, B2B marketplace", bio: "Tight on time, high signal-to-noise filter. Deletes anything that doesn't earn attention in the first line.", scores: [2.9, 4.1, 5.5, 6.3, null, null], feedback: ["Instant delete.", "Meh.", "Almost got me.", "Would read fully."] },
  { id: 6, initials: "EF", name: "Elena Faber", age: 41, gender: "Female", profession: "CMO, enterprise SaaS", bio: "Has seen every cold email playbook. Immune to buzzwords. Cares about specificity and originality.", scores: [3.5, 4.8, 6.2, 7.0, null, null], feedback: ["Buzzword soup.", "Slight improvement.", "Original angle.", "Specific and sharp."] },
  { id: 7, initials: "DK", name: "David Kim", age: 33, gender: "Male", profession: "Head of Sales, fintech startup", bio: "Runs outbound himself, so evaluates cold email with inside knowledge. Appreciates mechanism specificity.", scores: [5.3, 6.1, 6.5, 7.2, null, null], feedback: ["I write better.", "Like the mechanic.", "Solid framing.", "I'd use this myself."] },
  { id: 8, initials: "NB", name: "Nadia Bosch", age: 35, gender: "Female", profession: "VP Marketing, Series C", bio: "Budget owner who needs to justify spend to board. Responds to ROI framing and risk reduction.", scores: [4.0, 5.0, 5.9, 6.6, null, null], feedback: ["No ROI angle.", "Better but vague.", "Risk framing good.", "Would forward to team."] },
  { id: 9, initials: "RO", name: "Rafael Ortiz", age: 27, gender: "Male", profession: "Growth Engineer, early-stage", bio: "Technical founder doing growth. Hates vague claims. Wants to see the 'how', not just the 'what'.", scores: [3.1, 4.6, 5.6, 6.4, null, null], feedback: ["No mechanism.", "Some signal.", "Mechanism emerging.", "Shows the 'how'."] },
  { id: 10, initials: "PH", name: "Priya Holt", age: 39, gender: "Female", profession: "Director of Revenue, SaaS", bio: "Quota-carrying leader. Evaluates everything by whether it solves a real pipeline problem.", scores: [4.8, 5.4, 6.0, 6.7, null, null], feedback: ["Not pipeline-specific.", "Closer.", "Resonant.", "Would try it."] },
  { id: 11, initials: "BM", name: "Ben Müller", age: 45, gender: "Male", profession: "Fractional CRO", bio: "Advises multiple startups on go-to-market. Pattern-matches on quality instantly. Very high bar.", scores: [3.6, 4.4, 5.8, 6.5, null, null], feedback: ["Below average.", "Average.", "Above average.", "Worth exploring."] },
  { id: 12, initials: "CL", name: "Clara Liu", age: 31, gender: "Female", profession: "Demand Gen Manager, B2B tech", bio: "Manages outbound campaigns herself, evaluates from a practitioner's lens. Rewards specificity.", scores: [4.7, 5.6, 6.3, 7.0, null, null], feedback: ["Too vague.", "Improving.", "Practitioner-approved.", "Would A/B test this."] },
]

/** Chart data — only completed iterations */
const CHART_DATA = ITERATION_SCORES
  .map((score, i) => ({ iteration: i + 1, score }))
  .filter((d) => d.score !== null) as { iteration: number; score: number }[]

// ─── Score helpers ────────────────────────────────────────────────────────────

function scoreColor(score: number | null): string {
  if (score === null) return "bg-muted"
  if (score >= 6.5) return "bg-emerald-500"
  if (score >= 5.5) return "bg-lime-400"
  if (score >= 4.5) return "bg-amber-400"
  if (score >= 3.5) return "bg-orange-400"
  return "bg-red-400"
}

function scoreTextColor(score: number | null): string {
  if (score === null) return "text-muted-foreground"
  if (score >= 5.5) return "text-white"
  return "text-white"
}

function iterationStatus(index: number) {
  const n = index + 1
  if (n <= CAMPAIGN.completedIterations) return "completed"
  if (n === CAMPAIGN.completedIterations + 1 && CAMPAIGN.status === "running") return "running"
  return "pending"
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CampaignResultsPage() {
  const [activeIteration, setActiveIteration] = useState(1)

  const iterScore = ITERATION_SCORES[activeIteration - 1]
  const iterContent = ITERATION_CONTENT[activeIteration]
  const iterFeedback = ITERATION_FEEDBACK[activeIteration]
  const isComplete = activeIteration <= CAMPAIGN.completedIterations

  return (
    <TooltipProvider delayDuration={100}>
      <div className="min-h-screen bg-background">
        {/* ── Top header ─────────────────────────────────────────────────── */}
        <header className="border-b bg-background px-6 py-4">
          <div className="max-w-6xl mx-auto">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
              <Link href="/refinery" className="flex items-center gap-1 hover:text-foreground transition-colors">
                <FlaskConical className="h-3 w-3" />
                Refinery
              </Link>
              <span>/</span>
              <span className="text-foreground">{CAMPAIGN.name}</span>
            </div>

            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-semibold">{CAMPAIGN.name}</h1>
                <Badge variant="secondary" className="gap-1.5">
                  <Mail className="h-3 w-3" />
                  {CAMPAIGN.contentType}
                </Badge>
                <StatusBadge status={CAMPAIGN.status} />
              </div>

              {/* Progress */}
              <div className="shrink-0 text-right">
                <p className="text-sm font-medium text-foreground">
                  {CAMPAIGN.completedIterations} of {CAMPAIGN.totalIterations} iterations complete
                </p>
                <div className="mt-1.5 h-1.5 w-48 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${(CAMPAIGN.completedIterations / CAMPAIGN.totalIterations) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
          {/* ── Iteration selector ───────────────────────────────────────── */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Iterations</p>
            <div className="flex items-center gap-2 flex-wrap">
              {Array.from({ length: CAMPAIGN.totalIterations }, (_, i) => {
                const n = i + 1
                const status = iterationStatus(i)
                const score = ITERATION_SCORES[i]
                const isActive = activeIteration === n

                return (
                  <button
                    key={n}
                    onClick={() => status !== "pending" && setActiveIteration(n)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-all",
                      isActive
                        ? "border-primary bg-primary text-primary-foreground font-medium shadow-sm"
                        : status === "completed"
                        ? "border-border hover:border-primary hover:bg-accent cursor-pointer"
                        : status === "running"
                        ? "border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 cursor-pointer"
                        : "border-dashed border-muted-foreground/30 text-muted-foreground cursor-default opacity-60"
                    )}
                  >
                    <span className="font-medium">#{n}</span>
                    {status === "completed" && score !== null && (
                      <span className={cn(
                        "text-xs font-semibold rounded px-1.5 py-0.5",
                        isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-foreground"
                      )}>
                        {score.toFixed(1)}
                      </span>
                    )}
                    {status === "running" && (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    )}
                    {status === "pending" && (
                      <Clock className="h-3 w-3" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <Separator />

          {/* ── Iteration detail ─────────────────────────────────────────── */}
          {isComplete ? (
            <>
              <div className="grid grid-cols-2 gap-6">
                {/* Left: content version */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <h2 className="text-sm font-semibold">Version {activeIteration}</h2>
                  </div>
                  <div className="rounded-lg border bg-muted/20 p-5">
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans text-foreground">
                      {iterContent}
                    </pre>
                  </div>
                </div>

                {/* Right: score + feedback */}
                <div className="space-y-4">
                  {/* Aggregate score */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <h2 className="text-sm font-semibold">Aggregate Score</h2>
                    </div>
                    <AggregateScore score={iterScore} iteration={activeIteration} />
                  </div>

                  <Separator />

                  {/* Qualitative feedback */}
                  <div>
                    <h2 className="text-sm font-semibold mb-3">Synthetic User Feedback</h2>
                    <div className="space-y-2.5">
                      {iterFeedback?.map((line, i) => (
                        <div key={i} className="flex gap-2.5 text-sm">
                          <span className="mt-0.5 shrink-0 h-4 w-4 rounded-full bg-muted flex items-center justify-center text-[10px] text-muted-foreground font-medium">
                            {i + 1}
                          </span>
                          <p className="text-muted-foreground leading-relaxed">{line}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* ── Synthetic user grid ─────────────────────────────────── */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold">
                    Synthetic Users — Iteration {activeIteration}
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    ({SYNTHETIC_USERS.length} users · hover for details)
                  </span>
                </div>

                <div className="grid grid-cols-6 gap-2">
                  {SYNTHETIC_USERS.map((user) => {
                    const score = user.scores[activeIteration - 1]
                    const fb = user.feedback[activeIteration - 1]
                    return (
                      <Tooltip key={user.id}>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              "aspect-square rounded-lg flex flex-col items-center justify-center gap-1 cursor-default select-none transition-all hover:scale-105 hover:shadow-md",
                              scoreColor(score)
                            )}
                          >
                            <span className={cn("text-sm font-bold", scoreTextColor(score))}>
                              {user.initials}
                            </span>
                            {score !== null && (
                              <span className={cn("text-xs font-semibold", scoreTextColor(score))}>
                                {score.toFixed(1)}
                              </span>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          className="max-w-[220px] p-3 space-y-2"
                        >
                          <div>
                            <p className="font-semibold text-sm">{user.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {user.age} · {user.gender} · {user.profession}
                            </p>
                          </div>
                          <p className="text-xs leading-relaxed">{user.bio}</p>
                          <Separator />
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Score</span>
                            <span className="text-sm font-bold">
                              {score !== null ? score.toFixed(1) : "—"} / 10
                            </span>
                          </div>
                          {fb && (
                            <p className="text-xs text-muted-foreground italic">"{fb}"</p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    )
                  })}
                </div>

                {/* Score legend */}
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
              {iterationStatus(activeIteration - 1) === "running" ? (
                <>
                  <Loader2 className="h-8 w-8 text-amber-500 animate-spin mb-3" />
                  <p className="text-sm font-medium">Iteration {activeIteration} is running…</p>
                  <p className="text-xs text-muted-foreground mt-1">Synthetic users are evaluating this version. Check back shortly.</p>
                </>
              ) : (
                <>
                  <Clock className="h-8 w-8 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium">Iteration {activeIteration} hasn't started yet</p>
                  <p className="text-xs text-muted-foreground mt-1">It will run automatically after the previous iterations complete.</p>
                </>
              )}
            </div>
          )}

          <Separator />

          {/* ── Progression chart ────────────────────────────────────────── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Score Progression</h2>
              <span className="text-xs text-muted-foreground">Average score across completed iterations</span>
            </div>
            <ProgressionChart
              data={CHART_DATA}
              activeIteration={activeIteration}
              onDotClick={(n) => n <= CAMPAIGN.completedIterations && setActiveIteration(n)}
            />
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: "running" | "completed" }) {
  if (status === "completed") {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-full px-2.5 py-0.5">
        <CheckCircle2 className="h-3 w-3" />
        Completed
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-full px-2.5 py-0.5">
      <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
      Running
    </span>
  )
}

function AggregateScore({
  score,
  iteration,
}: {
  score: number | null
  iteration: number
}) {
  if (score === null) return null

  // Visual ring: use SVG circle
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const pct = score / 10
  const dashoffset = circumference * (1 - pct)

  const ringColor =
    score >= 6.5 ? "#10b981" :
    score >= 5.5 ? "#84cc16" :
    score >= 4.5 ? "#f59e0b" :
    "#ef4444"

  return (
    <div className="flex items-center gap-5">
      {/* Ring */}
      <div className="relative flex items-center justify-center">
        <svg width="96" height="96" className="-rotate-90">
          <circle
            cx="48" cy="48" r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted/50"
          />
          <circle
            cx="48" cy="48" r={radius}
            fill="none"
            stroke={ringColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashoffset}
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        <div className="absolute text-center">
          <span className="text-xl font-bold tabular-nums leading-none">{score.toFixed(1)}</span>
          <span className="block text-[10px] text-muted-foreground">/&nbsp;10</span>
        </div>
      </div>

      {/* Context */}
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
            ? "Halfway there. Pain framing is landing but the CTA needs work."
            : "Opener and value prop aren't connecting yet. Iteration is helping."}
        </p>
        <div className="flex items-center gap-1.5 pt-0.5">
          <span className="text-xs text-muted-foreground">vs. iteration {Math.max(1, iteration - 1)}</span>
          {iteration > 1 && ITERATION_SCORES[iteration - 2] !== null && (
            <span className="text-xs font-medium text-emerald-600">
              +{(score - (ITERATION_SCORES[iteration - 2] as number)).toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

interface ChartPoint {
  iteration: number
  score: number
}

function ProgressionChart({
  data,
  activeIteration,
  onDotClick,
}: {
  data: ChartPoint[]
  activeIteration: number
  onDotClick: (n: number) => void
}) {
  return (
    <div className="rounded-lg border bg-muted/10 p-4">
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="iteration"
            tickFormatter={(v) => `#${v}`}
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          <YAxis
            domain={[0, 10]}
            ticks={[0, 2, 4, 6, 8, 10]}
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          <RechartsTooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const d = payload[0].payload as ChartPoint
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
            dot={(props: { cx: number; cy: number; payload: ChartPoint }) => {
              const { cx, cy, payload } = props
              const isActive = payload.iteration === activeIteration
              return (
                <circle
                  key={payload.iteration}
                  cx={cx}
                  cy={cy}
                  r={isActive ? 6 : 4}
                  fill={isActive ? "hsl(var(--primary))" : "hsl(var(--background))"}
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  style={{ cursor: "pointer" }}
                  onClick={() => onDotClick(payload.iteration)}
                />
              )
            }}
            activeDot={{ r: 7, style: { cursor: "pointer" } }}
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-xs text-muted-foreground text-center mt-1">
        Click a point to jump to that iteration
      </p>
    </div>
  )
}
