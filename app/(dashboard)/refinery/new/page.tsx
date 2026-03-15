"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Mail,
  Zap,
  MessageSquare,
  FileText,
  Share2,
  LayoutTemplate,
  ChevronRight,
  ChevronLeft,
  Upload,
  X,
  Check,
  Plus,
  FlaskConical,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ── Types ────────────────────────────────────────────────────────────────────

type ContentType =
  | "cold-email"
  | "ad-creative"
  | "subject-line"
  | "landing-page"
  | "social-post"
  | "other"

interface FormState {
  // Step 1
  contentType: ContentType | null
  draft: string
  // Step 2
  icp: string
  // Step 3
  ragText: string
  ragFiles: string[] // just filenames for the UI shell
  // Step 4
  metrics: string[]
  customMetric: string
  // Step 5
  context: string
  // Step 6
  campaignName: string
  iterations: number
  usersPerIteration: number
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STEPS = [
  { number: 1, label: "Content" },
  { number: 2, label: "ICP" },
  { number: 3, label: "RAG Data" },
  { number: 4, label: "Metrics" },
  { number: 5, label: "Context" },
  { number: 6, label: "Run Setup" },
]

const CONTENT_TYPES: {
  id: ContentType
  label: string
  description: string
  icon: React.ReactNode
}[] = [
  {
    id: "cold-email",
    label: "Cold Email",
    description: "Outbound email sequences",
    icon: <Mail className="h-5 w-5" />,
  },
  {
    id: "ad-creative",
    label: "Ad Creative",
    description: "Paid social or display copy",
    icon: <Zap className="h-5 w-5" />,
  },
  {
    id: "subject-line",
    label: "Subject Line",
    description: "Email subject lines",
    icon: <MessageSquare className="h-5 w-5" />,
  },
  {
    id: "landing-page",
    label: "Landing Page Copy",
    description: "Hero, CTA, and body copy",
    icon: <LayoutTemplate className="h-5 w-5" />,
  },
  {
    id: "social-post",
    label: "Social Post",
    description: "LinkedIn, Twitter, etc.",
    icon: <Share2 className="h-5 w-5" />,
  },
  {
    id: "other",
    label: "Other",
    description: "Any other marketing copy",
    icon: <FileText className="h-5 w-5" />,
  },
]

const PRESET_METRICS = [
  "Reply Rate",
  "CTR",
  "Curiosity",
  "Premium Feel",
  "Clarity",
  "Persuasiveness",
  "Urgency",
  "Trust",
  "Relevance",
  "Excitement",
]

const INITIAL_FORM: FormState = {
  contentType: null,
  draft: "",
  icp: "",
  ragText: "",
  ragFiles: [],
  metrics: [],
  customMetric: "",
  context: "",
  campaignName: "",
  iterations: 3,
  usersPerIteration: 10,
}

function stepStorageKey(id: string) {
  return `refinery_step_${id}`
}

// ── Main component ────────────────────────────────────────────────────────────

export default function NewCampaignPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const campaignId = searchParams.get("id")

  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [dragOver, setDragOver] = useState(false)
  const [launching, setLaunching] = useState(false)
  const [launchError, setLaunchError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [autoSaving, setAutoSaving] = useState(false)

  // Redirect to dashboard if no id (should always have one now)
  useEffect(() => {
    if (!campaignId) {
      router.replace("/refinery")
    }
  }, [campaignId, router])

  // Load existing draft and restore step
  useEffect(() => {
    if (!campaignId) return
    fetch(`/api/refinery/campaigns?id=${campaignId}`)
      .then((r) => r.json())
      .then(({ campaign, error }) => {
        if (error || !campaign) return
        const ct = campaign.content_type
          ? (campaign.content_type.replace(/_/g, "-") as ContentType)
          : null
        setForm({
          contentType: ct,
          draft: campaign.initial_draft ?? "",
          icp: campaign.icp ?? "",
          ragText: campaign.rag_text ?? "",
          ragFiles: [],
          metrics: campaign.metrics ?? [],
          customMetric: "",
          context: campaign.extra_context ?? "",
          campaignName: campaign.name ?? "",
          iterations: campaign.iterations ?? 3,
          usersPerIteration: campaign.users_per_iter ?? 10,
        })
        // Restore saved step from localStorage
        const saved = localStorage.getItem(stepStorageKey(campaignId))
        if (saved) {
          const n = parseInt(saved, 10)
          if (n >= 1 && n <= STEPS.length) setStep(n)
        }
      })
  }, [campaignId])

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const canAdvance = () => {
    if (step === 1) return form.contentType !== null
    if (step === 2) return form.icp.trim().length > 0
    if (step === 4) return form.metrics.length > 0
    if (step === 6) return !launching
    return true
  }

  const buildPayload = (launch: boolean) => ({
    launch,
    name: form.campaignName.trim(),
    content_type: form.contentType ? form.contentType.replace(/-/g, "_") : "cold_email",
    initial_draft: form.draft.trim() || null,
    icp: form.icp.trim(),
    rag_text: form.ragText.trim() || null,
    rag_files: [],
    metrics: form.metrics,
    extra_context: form.context.trim() || null,
    iterations: form.iterations,
    users_per_iter: form.usersPerIteration,
  })

  const patchCampaign = async (launch: boolean) => {
    if (!campaignId) return
    const res = await fetch(`/api/refinery/campaigns?id=${campaignId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload(launch)),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error ?? "Something went wrong.")
  }

  const handleNext = async () => {
    if (step < STEPS.length) {
      // Auto-save current step then advance
      setAutoSaving(true)
      try {
        await patchCampaign(false)
      } catch {
        // Non-blocking — step still advances
      } finally {
        setAutoSaving(false)
      }
      const nextStep = step + 1
      setStep(nextStep)
      if (campaignId) localStorage.setItem(stepStorageKey(campaignId), String(nextStep))
    } else {
      launchCampaign()
    }
  }

  const launchCampaign = async () => {
    setLaunching(true)
    setLaunchError(null)
    try {
      await patchCampaign(true)
      // Fire processor — responds immediately, runs in background
      fetch("/api/refinery/processor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId }),
      })
      if (campaignId) localStorage.removeItem(stepStorageKey(campaignId))
      router.push(`/refinery/${campaignId}`)
    } catch (err) {
      setLaunchError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
      setLaunching(false)
    }
  }

  const saveCampaign = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      await patchCampaign(false)
      if (campaignId) localStorage.removeItem(stepStorageKey(campaignId))
      router.push("/refinery")
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
      setSaving(false)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      const prevStep = step - 1
      setStep(prevStep)
      if (campaignId) localStorage.setItem(stepStorageKey(campaignId), String(prevStep))
    }
  }

  const handleStepClick = (number: number) => {
    setStep(number)
    if (campaignId) localStorage.setItem(stepStorageKey(campaignId), String(number))
  }

  const toggleMetric = (metric: string) => {
    update(
      "metrics",
      form.metrics.includes(metric)
        ? form.metrics.filter((m) => m !== metric)
        : [...form.metrics, metric]
    )
  }

  const addCustomMetric = () => {
    const trimmed = form.customMetric.trim()
    if (!trimmed || form.metrics.includes(trimmed)) return
    update("metrics", [...form.metrics, trimmed])
    update("customMetric", "")
  }

  const removeFile = (name: string) =>
    update("ragFiles", form.ragFiles.filter((f) => f !== name))

  // Fake drag-and-drop (UI only)
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const names = Array.from(e.dataTransfer.files).map((f) => f.name)
    update("ragFiles", [...form.ragFiles, ...names])
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-background -m-6">
      {/* ── Horizontal step bar ─────────────────────────────── */}
      <div className="border-b bg-background shrink-0 px-8">
        <div className="flex items-center gap-0">
          {STEPS.map(({ number, label }) => {
            const isActive = step === number
            const isCompleted = step > number
            return (
              <button
                key={number}
                onClick={() => isCompleted && handleStepClick(number)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm border-b-2 transition-none",
                  isActive
                    ? "border-primary text-foreground font-medium"
                    : isCompleted
                    ? "border-transparent text-foreground hover:text-foreground cursor-pointer"
                    : "border-transparent text-muted-foreground cursor-default"
                )}
              >
                <span className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold border",
                  isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : isCompleted
                    ? "border-transparent bg-primary text-primary-foreground"
                    : "border-muted-foreground/40 text-muted-foreground"
                )}>
                  {isCompleted ? <Check className="h-3 w-3" /> : number}
                </span>
                <span>{label}</span>
              </button>
            )
          })}
          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            {autoSaving && <><Loader2 className="h-3 w-3 animate-spin" />Saving…</>}
            {form.campaignName && <span className="font-medium text-foreground">{form.campaignName}</span>}
          </div>
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-8 py-4 border-b shrink-0">
          <div>
            <h1 className="text-lg font-semibold">{STEPS[step - 1].label}</h1>
            <p className="text-sm text-muted-foreground">{stepSubtitle(step)}</p>
          </div>
          {autoSaving && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving…
            </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto px-8 py-6">
          {step === 1 && <Step1Content form={form} update={update} />}
          {step === 2 && <Step2ICP form={form} update={update} />}
          {step === 3 && (
            <Step3RAG
              form={form}
              update={update}
              dragOver={dragOver}
              setDragOver={setDragOver}
              handleDrop={handleDrop}
              removeFile={removeFile}
            />
          )}
          {step === 4 && (
            <Step4Metrics
              form={form}
              update={update}
              toggleMetric={toggleMetric}
              addCustomMetric={addCustomMetric}
            />
          )}
          {step === 5 && <Step5Context form={form} update={update} />}
          {step === 6 && <Step6RunSetup form={form} update={update} />}
        </div>

        <footer className="shrink-0 border-t px-8 py-4 flex items-center justify-between bg-background">
          <Button variant="ghost" onClick={handleBack} disabled={step === 1 || launching || autoSaving}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>

          <div className="flex items-center gap-3">
            {(launchError || saveError) && (
              <p className="text-sm text-destructive">{launchError ?? saveError}</p>
            )}
            {step === 3 && !launchError && !saveError && (
              <span className="text-xs text-muted-foreground">Optional step — you can skip</span>
            )}
            {step === 5 && !launchError && !saveError && (
              <span className="text-xs text-muted-foreground">Optional step — you can skip</span>
            )}
            <Button
              variant="outline"
              onClick={saveCampaign}
              disabled={saving || launching || autoSaving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save & Exit"
              )}
            </Button>
            <Button onClick={handleNext} disabled={!canAdvance() || saving || autoSaving}>
              {step === STEPS.length ? (
                launching ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    Launching…
                  </>
                ) : (
                  <>
                    <FlaskConical className="h-4 w-4 mr-1.5" />
                    Launch Campaign
                  </>
                )
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </footer>
      </main>
    </div>
  )
}

// ── Step subtitle helper ───────────────────────────────────────────────────────

function stepSubtitle(step: number) {
  switch (step) {
    case 1: return "Choose what you want to optimize and provide a starting draft."
    case 2: return "Describe your ideal customer profile to ground the synthetic users."
    case 3: return "Paste or upload existing research to make synthetic users more accurate."
    case 4: return "Select the signals you want to optimize for."
    case 5: return "Add any extra context about your product or campaign."
    case 6: return "Configure how many iterations and synthetic users to run."
    default: return ""
  }
}

// ── Step 1: Content ───────────────────────────────────────────────────────────

function Step1Content({
  form,
  update,
}: {
  form: FormState
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void
}) {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="space-y-2">
        <Label className="text-sm font-medium">What do you want to optimize?</Label>
        <div className="grid grid-cols-3 gap-3">
          {CONTENT_TYPES.map(({ id, label, description, icon }) => (
            <button
              key={id}
              onClick={() => update("contentType", id)}
              className={cn(
                "flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-all hover:border-primary hover:bg-accent",
                form.contentType === id
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border"
              )}
            >
              <div
                className={cn(
                  "rounded-md p-1.5",
                  form.contentType === id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {icon}
              </div>
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="draft" className="text-sm font-medium">
          Starting draft{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <p className="text-xs text-muted-foreground">
          Paste your current copy here. If left blank, Refinery will generate a first version for you.
        </p>
        <Textarea
          id="draft"
          placeholder="Paste your current email, ad copy, subject line, etc."
          className="min-h-[180px] resize-none"
          value={form.draft}
          onChange={(e) => update("draft", e.target.value)}
        />
      </div>
    </div>
  )
}

// ── Step 2: ICP ───────────────────────────────────────────────────────────────

function Step2ICP({
  form,
  update,
}: {
  form: FormState
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void
}) {
  return (
    <div className="max-w-2xl space-y-4">
      <div className="rounded-md bg-muted/50 border px-4 py-3 text-sm text-muted-foreground">
        Be specific — the more detail you give about your ideal customer, the more accurate the synthetic users will be.
      </div>

      <div className="space-y-2">
        <Label htmlFor="icp" className="text-sm font-medium">
          ICP Description
        </Label>
        <Textarea
          id="icp"
          placeholder={`Example:\nB2B SaaS founders and Head of Growth at Series A–B startups (20–150 employees). They're overwhelmed, data-driven, and allergic to fluff. They've been burned by agencies before and are skeptical of anything that sounds like a sales pitch. They care deeply about CAC, pipeline efficiency, and time-to-close.`}
          className="min-h-[220px] resize-none"
          value={form.icp}
          onChange={(e) => update("icp", e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Include: job titles, company stage, pain points, motivations, and any relevant demographics.
        </p>
      </div>
    </div>
  )
}

// ── Step 3: RAG Data ──────────────────────────────────────────────────────────

function Step3RAG({
  form,
  update,
  dragOver,
  setDragOver,
  handleDrop,
  removeFile,
}: {
  form: FormState
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void
  dragOver: boolean
  setDragOver: (v: boolean) => void
  handleDrop: (e: React.DragEvent) => void
  removeFile: (name: string) => void
}) {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="rounded-md bg-muted/50 border px-4 py-3 text-sm text-muted-foreground">
        Ground your synthetic users in real data — customer interviews, sales call transcripts, Trustpilot reviews, support tickets, etc.
      </div>

      {/* Text paste */}
      <div className="space-y-2">
        <Label htmlFor="ragText" className="text-sm font-medium">
          Paste transcripts, reviews, or notes
        </Label>
        <Textarea
          id="ragText"
          placeholder={`Paste any raw customer voice data here...\n\nExample:\n"We tried three tools before this one. The onboarding was always the problem — nobody had time to read docs." — Sarah, VP Marketing\n\n"Price wasn't the issue. Trust was." — Anon review, G2`}
          className="min-h-[180px] resize-none"
          value={form.ragText}
          onChange={(e) => update("ragText", e.target.value)}
        />
      </div>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground shrink-0">or upload files</span>
        <Separator className="flex-1" />
      </div>

      {/* File drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
        )}
      >
        <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
        <p className="text-sm font-medium">Drag files here, or click to browse</p>
        <p className="text-xs text-muted-foreground mt-1">PDF, TXT, DOCX, CSV — up to 10 MB each</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => {}}>
          Browse files
        </Button>
      </div>

      {/* Uploaded files list */}
      {form.ragFiles.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Uploaded files</Label>
          <div className="space-y-1.5">
            {form.ragFiles.map((name) => (
              <div
                key={name}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
              >
                <span className="text-foreground">{name}</span>
                <button
                  onClick={() => removeFile(name)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Step 4: Metrics ───────────────────────────────────────────────────────────

function Step4Metrics({
  form,
  update,
  toggleMetric,
  addCustomMetric,
}: {
  form: FormState
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void
  toggleMetric: (m: string) => void
  addCustomMetric: () => void
}) {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="space-y-3">
        <Label className="text-sm font-medium">What do you want to optimize for?</Label>
        <p className="text-xs text-muted-foreground">
          Select one or more metrics. Synthetic users will score and give feedback on each.
        </p>
        <div className="flex flex-wrap gap-2">
          {PRESET_METRICS.map((metric) => {
            const selected = form.metrics.includes(metric)
            return (
              <button
                key={metric}
                onClick={() => toggleMetric(metric)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium border transition-all",
                  selected
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-foreground border-border hover:border-primary hover:bg-accent"
                )}
              >
                {selected && <Check className="inline h-3 w-3 mr-1.5 -mt-0.5" />}
                {metric}
              </button>
            )
          })}
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Add a custom metric{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <div className="flex gap-2">
          <Input
            placeholder="e.g. Exclusivity, FOMO, Authority…"
            value={form.customMetric}
            onChange={(e) => update("customMetric", e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addCustomMetric() }}
          />
          <Button variant="outline" onClick={addCustomMetric} disabled={!form.customMetric.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {form.metrics.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Selected metrics ({form.metrics.length})</Label>
          <div className="flex flex-wrap gap-1.5">
            {form.metrics.map((m) => (
              <Badge key={m} variant="secondary" className="gap-1 pr-1">
                {m}
                <button
                  onClick={() => toggleMetric(m)}
                  className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Step 5: Context ───────────────────────────────────────────────────────────

function Step5Context({
  form,
  update,
}: {
  form: FormState
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void
}) {
  return (
    <div className="max-w-2xl space-y-4">
      <div className="space-y-2">
        <Label htmlFor="context" className="text-sm font-medium">
          Additional context about your product or campaign
        </Label>
        <p className="text-xs text-muted-foreground">
          Anything that helps synthetic users better understand what they're evaluating — pricing, key differentiators, competitors, objections to address, tone of voice, etc.
        </p>
        <Textarea
          id="context"
          placeholder={`Example:\nWe're a B2B prospecting tool that integrates with HubSpot and Salesforce. Our biggest differentiator is that we use AI to auto-personalize outbound at scale — not just name/company inserts, but genuine research-backed personalization. Key objections: "we already use [competitor]", "we don't have budget". Tone: confident, direct, no buzzwords.`}
          className="min-h-[220px] resize-none"
          value={form.context}
          onChange={(e) => update("context", e.target.value)}
        />
      </div>
    </div>
  )
}

// ── Step 6: Run Setup ─────────────────────────────────────────────────────────

function Step6RunSetup({
  form,
  update,
}: {
  form: FormState
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void
}) {
  return (
    <div className="max-w-2xl space-y-8">
      {/* Campaign name */}
      <div className="space-y-2">
        <Label htmlFor="campaignName" className="text-sm font-medium">
          Campaign name
        </Label>
        <Input
          id="campaignName"
          placeholder="e.g. Q2 Cold Email — SaaS Founders"
          value={form.campaignName}
          onChange={(e) => update("campaignName", e.target.value)}
        />
      </div>

      <Separator />

      {/* Iterations */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Iterations</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              How many rounds of scoring and rewriting to run.
            </p>
          </div>
          <span className="text-2xl font-bold tabular-nums">{form.iterations}</span>
        </div>
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={form.iterations}
          onChange={(e) => update("iterations", Number(e.target.value))}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>1 (quick)</span>
          <span>10 (thorough)</span>
        </div>
      </div>

      {/* Users per iteration */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Synthetic users per iteration</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              How many distinct personas will evaluate each version.
            </p>
          </div>
          <span className="text-2xl font-bold tabular-nums">{form.usersPerIteration}</span>
        </div>
        <input
          type="range"
          min={5}
          max={50}
          step={5}
          value={form.usersPerIteration}
          onChange={(e) => update("usersPerIteration", Number(e.target.value))}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>5</span>
          <span>50</span>
        </div>
      </div>

      <Separator />

      {/* Summary card */}
      <div className="rounded-lg border bg-muted/30 px-5 py-4 space-y-3">
        <p className="text-sm font-medium">Campaign summary</p>
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <span className="text-muted-foreground">Content type</span>
          <span className="capitalize">{form.contentType?.replace(/-/g, " ") ?? "—"}</span>
          <span className="text-muted-foreground">Metrics</span>
          <span>{form.metrics.length > 0 ? form.metrics.join(", ") : "—"}</span>
          <span className="text-muted-foreground">Iterations</span>
          <span>{form.iterations}</span>
          <span className="text-muted-foreground">Users / iteration</span>
          <span>{form.usersPerIteration}</span>
          <span className="text-muted-foreground">Total evaluations</span>
          <span className="font-semibold">{form.iterations * form.usersPerIteration}</span>
        </div>
      </div>
    </div>
  )
}
