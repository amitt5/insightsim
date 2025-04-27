"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { usePersonas } from "@/lib/usePersonas"
import { PersonaCard } from "@/components/persona-card"
import { CreatePersonaDialog } from "@/components/create-persona-dialog"

export default function PersonasPage() {
  const [open, setOpen] = useState(false)
  const { personas, loading, error, mutate } = usePersonas()

  const handleSavePersona = (personaData: any) => {
    console.log("Save persona:", personaData)
    // Here you would implement the save functionality
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Personas</h1>
        <CreatePersonaDialog 
          open={open}
          onOpenChange={setOpen}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Personas</CardTitle>
          <CardDescription>Manage your AI participant personas for simulations</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="p-4 text-center text-gray-500">Loading personas...</div>
          ) : error ? (
            <div className="p-4 text-center text-red-500">{error}</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {personas.map((persona) => (
                <PersonaCard key={persona.id} persona={persona} onUpdate={mutate} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
