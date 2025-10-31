"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Persona } from "@/utils/types"

export default function EnhancedPersonasListPage() {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()

  // Fetch personas with grounded=true
  useEffect(() => {
    const fetchPersonas = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/personas?grounded=true')
        if (response.ok) {
          const data = await response.json()
          setPersonas(Array.isArray(data) ? data : [])
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch personas",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error fetching personas:", error)
        toast({
          title: "Error",
          description: "Failed to fetch personas",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchPersonas()
  }, [toast])

  // Handle delete persona
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/personas?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Persona deleted successfully",
        })
        // Refresh the list
        const updatedResponse = await fetch('/api/personas?grounded=true')
        if (updatedResponse.ok) {
          const data = await updatedResponse.json()
          setPersonas(Array.isArray(data) ? data : [])
        }
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to delete persona",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting persona:", error)
      toast({
        title: "Error",
        description: "Failed to delete persona",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Enhanced Personas</h1>
          <p className="text-sm text-muted-foreground mt-1">View, edit, or delete enhanced personas.</p>
        </div>
        <Button asChild>
          <Link href="/personas/enhanced/new">Create New Enhanced Persona</Link>
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-sm text-muted-foreground">Loading personas...</div>
          </CardContent>
        </Card>
      ) : personas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-sm text-muted-foreground mb-4">No enhanced personas yet.</div>
            <Button asChild>
              <Link href="/personas/enhanced/new">Create New Enhanced Persona</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Age</TableHead>
                <TableHead className="w-[1%] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {personas.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link
                      href={`/personas/enhanced/${p.id}`}
                      className="text-primary hover:underline font-medium"
                    >
                      {p.name || "Unnamed Persona"}
                    </Link>
                  </TableCell>
                  <TableCell>{p.age || "N/A"}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/personas/enhanced/${p.id}`)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(p.id, p.name || "Unnamed Persona")}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

