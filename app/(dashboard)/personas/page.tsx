"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus } from "lucide-react"
import { usePersonas } from "@/lib/usePersonas"
import { PersonaCard } from "@/components/persona-card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function PersonasPage() {
  const [open, setOpen] = useState(false)
  const { personas, loading, error } = usePersonas()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Personas</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create New Persona
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Persona</DialogTitle>
              <DialogDescription>Add a new AI participant persona for your simulations</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input id="age" type="number" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Non-binary">Non-binary</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="occupation">Occupation</Label>
                <Input id="occupation" />
              </div>


              <div className="space-y-2">
                <Label htmlFor="archetype">Archetype</Label>
                <Input id="archetype" placeholder="e.g., Budget Buyer, Trendsetter" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Short Bio</Label>
                <Textarea id="bio" rows={3} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="traits">Traits (comma-separated)</Label>
                <Input id="traits" placeholder="e.g., Health-conscious, Tech-savvy" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="persona_goal">Persona Goal</Label>
                <Input id="persona_goal" placeholder="What is this persona trying to achieve?" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="attitude">Attitude Toward Topic</Label>
                <Input id="attitude" placeholder="Initial bias or opinion" />
              </div>

            </div>
            <DialogFooter>
              <Button type="submit" onClick={() => setOpen(false)}>
                Save Persona
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
                <PersonaCard key={persona.id} persona={persona} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
