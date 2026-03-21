"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FlaskConical, Plus, Trash2, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Campaign {
  id: string
  name: string
  content_type: string
  status: string
  iterations: number
  users_per_iter: number
  created_at: string
}

const STATUS_STYLE: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  draft:     { label: "Draft",     variant: "outline" },
  pending:   { label: "Pending",   variant: "secondary" },
  running:   { label: "Running",   variant: "default" },
  completed: { label: "Completed", variant: "secondary" },
  failed:    { label: "Failed",    variant: "destructive" },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatType(raw: string) {
  if (!raw) return "—"
  return raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function RefineryDashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Campaign | null>(null)
  const [deleting, setDeleting] = useState(false)

  // New campaign modal
  const [newModalOpen, setNewModalOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [creating, setCreating] = useState(false)

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

  async function handleCreate() {
    if (!newName.trim()) return
    setCreating(true)
    try {
      const res = await fetch("/api/refinery/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          launch: false,
          name: newName.trim(),
          content_type: "cold_email",
          initial_draft: null,
          icp: "",
          rag_text: null,
          rag_files: [],
          metrics: [],
          extra_context: null,
          iterations: 3,
          users_per_iter: 10,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to create campaign")
      setNewModalOpen(false)
      setNewName("")
      router.push(`/refinery/${data.campaignId}`)
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Could not create campaign",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/refinery/campaigns/${deleteTarget.id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Delete failed")
      setCampaigns((prev) => prev.filter((c) => c.id !== deleteTarget.id))
      toast({ title: "Campaign deleted" })
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Could not delete campaign",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Refinery</h1>
          <p className="text-sm text-muted-foreground">Optimise marketing copy through iterative synthetic testing</p>
        </div>
        <Button onClick={() => { setNewName(""); setNewModalOpen(true) }}>
          <Plus className="h-4 w-4 mr-1.5" />
          New Campaign
        </Button>
      </div>

      {/* New campaign modal */}
      <Dialog open={newModalOpen} onOpenChange={(open) => { if (!open && !creating) { setNewModalOpen(false); setNewName("") } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Campaign</DialogTitle>
            <DialogDescription>
              Enter a name for your campaign. You can always change it later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="new-campaign-name">Name</Label>
            <Input
              id="new-campaign-name"
              placeholder="e.g. Q2 Cold Email — SaaS Founders"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreate() }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setNewModalOpen(false); setNewName("") }} disabled={creating}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!newName.trim() || creating}>
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Creating…
                </>
              ) : (
                "Create Campaign"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            Refinery helps you optimise marketing copy through iterative synthetic user testing.
            Create your first campaign to get started.
          </p>
          <Button onClick={() => { setNewName(""); setNewModalOpen(true) }}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Campaign
          </Button>
        </div>
      )}

      {!loading && !error && campaigns.length > 0 && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Iterations</TableHead>
                <TableHead>Users / Iteration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((c) => {
                const status = STATUS_STYLE[c.status] ?? { label: c.status, variant: "outline" as const }
                const href = `/refinery/${c.id}`
                return (
                  <TableRow key={c.id} className="group">
                    <TableCell>
                      <Link href={href} className="font-medium hover:underline">
                        {c.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatType(c.content_type)}</TableCell>
                    <TableCell>{c.iterations}</TableCell>
                    <TableCell>{c.users_per_iter}</TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(c.created_at)}</TableCell>
                    <TableCell>
                      <button
                        onClick={() => setDeleteTarget(c)}
                        className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                        aria-label="Delete campaign"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete campaign?</DialogTitle>
            <DialogDescription>
              This will permanently delete <span className="font-medium text-foreground">{deleteTarget?.name}</span> and all its iterations and responses. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
