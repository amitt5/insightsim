"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function EnhancedPersonasNewPage() {
  const [basicDemographics, setBasicDemographics] = useState("")
  const [behaviorsAttitudes, setBehaviorsAttitudes] = useState("")
  const [researchContext, setResearchContext] = useState("")
  const [showGenerated, setShowGenerated] = useState(false)

  // Fixed example persona details for now (UI only, no logic)
  const [personaForm, setPersonaForm] = useState({
    name: "Sarah Mitchell",
    age: "38",
    gender: "Female",
    occupation: "Software Engineer",
    location: "San Jose, CA",
    archetype: "The Digitally Empowered Homeowner",
    bio: "Sarah is a tech-savvy homeowner who values efficiency and smart home technology.",
    traits: "Tech-Savvy, Efficiency-Driven, Proactive",
    goal: "To find a home insurance solution that seamlessly integrates with her lifestyle",
  })

  const handlePersonaChange = (field: string, value: string) => {
    setPersonaForm(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create Enhanced Persona</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Step 1: Provide initial details to generate a base persona.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Initial Persona Creation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Basic Demographics</label>
            <Textarea
              placeholder="Enter basic information (name, age, occupation, location, etc.)"
              value={basicDemographics}
              onChange={(e) => setBasicDemographics(e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Behaviors & Attitudes</label>
            <Textarea
              placeholder="Describe how they interact with your product category, their goals, frustrations, etc."
              value={behaviorsAttitudes}
              onChange={(e) => setBehaviorsAttitudes(e.target.value)}
              rows={5}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Research Context</label>
            <Textarea
              placeholder="What are you trying to learn from this persona? What scenarios will they be responding to?"
              value={researchContext}
              onChange={(e) => setResearchContext(e.target.value)}
              rows={4}
            />
          </div>

          <div className="pt-2">
            <Button type="button" className="w-full sm:w-auto" onClick={() => setShowGenerated(true)}>
              Generate Persona
            </Button>
          </div>
        </CardContent>
      </Card>

      {showGenerated && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Persona (Not yet research-enhanced)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={personaForm.name} onChange={(e) => handlePersonaChange("name", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input id="age" type="number" value={personaForm.age} onChange={(e) => handlePersonaChange("age", e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={personaForm.gender} onValueChange={(v) => handlePersonaChange("gender", v)}>
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
                <Input id="occupation" value={personaForm.occupation} onChange={(e) => handlePersonaChange("occupation", e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" value={personaForm.location} onChange={(e) => handlePersonaChange("location", e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="archetype">Archetype</Label>
                <Input id="archetype" value={personaForm.archetype} onChange={(e) => handlePersonaChange("archetype", e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Short Bio</Label>
                <Textarea id="bio" rows={3} value={personaForm.bio} onChange={(e) => handlePersonaChange("bio", e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="traits">Traits (comma-separated)</Label>
                <Input id="traits" value={personaForm.traits} onChange={(e) => handlePersonaChange("traits", e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="goal">Persona Goal</Label>
                <Input id="goal" value={personaForm.goal} onChange={(e) => handlePersonaChange("goal", e.target.value)} />
              </div>

              <div className="pt-2">
                <Button type="button" disabled>
                  Save Changes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


