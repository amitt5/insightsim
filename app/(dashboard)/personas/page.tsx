"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { usePersonas } from "@/lib/usePersonas"
import { PersonaCard } from "@/components/persona-card"
import { CreatePersonaDialog } from "@/components/create-persona-dialog"
import PersonaFilter from "@/components/persona-filter"
import { Persona } from "@/utils/types"

export default function PersonasPage() {
  const [open, setOpen] = useState(false)
  const { personas, loading, error, mutate } = usePersonas()
  const [hideSystemPersonas, setHideSystemPersonas] = useState(false)
  const [filteredPersonas, setFilteredPersonas] = useState<Persona[]>([])

  const handleSavePersona = (personaData: any) => {
    // replaceme: console.log("Save persona:", personaData)
    // Here you would implement the save functionality
  }

  // Filter personas based on hideSystemPersonas state
  const baseFilteredPersonas = hideSystemPersonas 
    ? personas.filter(persona => persona.editable === true)
    : personas;

  // Handle filtered personas from the filter component
  const handleFilteredPersonasChange = useCallback((filtered: Persona[]) => {
    setFilteredPersonas(filtered);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Personas</h1>
        <CreatePersonaDialog 
          open={open}
          onOpenChange={setOpen}
          onHideSystemPersonasChange={setHideSystemPersonas}
          hideSystemPersonas={hideSystemPersonas}
          onSuccess={mutate}
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
            <div className="space-y-6">
              <PersonaFilter
                personas={baseFilteredPersonas}
                onFilteredPersonasChange={handleFilteredPersonasChange}
              />
              
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredPersonas.map((persona) => (
                  <PersonaCard key={persona.id} persona={persona} onUpdate={mutate} />
                ))}
              </div>
              
              {filteredPersonas.length === 0 && baseFilteredPersonas.length > 0 && (
                <div className="p-8 text-center text-gray-500">
                  <p className="text-lg">No personas found</p>
                  <p className="text-sm">Try adjusting your search or filter criteria</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
