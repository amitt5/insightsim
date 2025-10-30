"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function EnhancedPersonasListPage() {
  const personas: Array<{ id: string; name: string; updatedAt: string }> = []

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

      {personas.length === 0 ? (
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
                <TableHead>Last Updated</TableHead>
                <TableHead className="w-[1%] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {personas.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>{p.updatedAt}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="sm">Edit</Button>
                    <Button variant="ghost" size="sm">Delete</Button>
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

