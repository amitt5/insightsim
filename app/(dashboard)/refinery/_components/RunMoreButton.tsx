"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Plus, Minus } from "lucide-react"

interface Props {
  campaignId: string
  onComplete: () => void // refresh callback
}

export function RunMoreButton({ campaignId, onComplete }: Props) {
  const [open, setOpen] = useState(false)
  const [count, setCount] = useState(3)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleRun() {
    setRunning(true)
    setError(null)
    try {
      const extendRes = await fetch(`/api/refinery/campaigns/${campaignId}/extend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count }),
      })
      const extendData = await extendRes.json()
      if (extendData.error) throw new Error(extendData.error)

      const procRes = await fetch("/api/refinery/processor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId }),
      })
      const procData = await procRes.json()
      if (procData.error) throw new Error(procData.error)

      setOpen(false)
      onComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setRunning(false)
    }
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-3.5 w-3.5 mr-1.5" />
        Run More
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">More iterations:</span>
      <div className="flex items-center border rounded-md">
        <button
          onClick={() => setCount((c) => Math.max(1, c - 1))}
          className="px-2 py-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="px-3 py-1 text-sm font-semibold tabular-nums w-8 text-center">{count}</span>
        <button
          onClick={() => setCount((c) => Math.min(10, c + 1))}
          className="px-2 py-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      <Button size="sm" onClick={handleRun} disabled={running}>
        {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Run"}
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setOpen(false)} disabled={running}>
        Cancel
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  )
}
