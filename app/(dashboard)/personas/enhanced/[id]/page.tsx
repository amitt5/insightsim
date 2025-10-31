"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { generatePersonaFromThreeFields } from "@/utils/personaAnalysis"

export default function EnhancedPersonasIdPage() {
  const params = useParams<{ id: string }>()
  const isNew = (params?.id || "").toLowerCase() === "new"

  const [basicDemographics, setBasicDemographics] = useState("")
  const [behaviorsAttitudes, setBehaviorsAttitudes] = useState("")
  const [researchContext, setResearchContext] = useState("")
  const [showGenerated, setShowGenerated] = useState(false)
  const { toast } = useToast()

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
    attitude: "Optimistic about using technology to manage home tasks",
    family_status: "Married with one child",
    education_level: "Bachelor's Degree in Computer Science",
    income_level: "Upper-middle income bracket",
    lifestyle: "Enjoys DIY home projects and weekend cycling.",
    category_products: "Home Insurance A, Home Insurance B",
    product_relationship: "Prefers transparent policies and responsive support",
    category_habits: "Reviews coverage annually; compares options online",
  })

  const handlePersonaChange = (field: string, value: string) => {
    setPersonaForm(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{isNew ? 'Create Enhanced Persona' : 'Edit Enhanced Persona'}</h1>
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
            <Button
              type="button"
              className="w-full sm:w-auto"
              onClick={async () => {
                try {
                  const generated = await generatePersonaFromThreeFields({
                    basicDemographics,
                    behaviorsAttitudes,
                    researchContext,
                  })
                  setPersonaForm({
                    name: generated.name || "",
                    age: generated.age ? String(generated.age) : "",
                    gender: generated.gender || "",
                    occupation: generated.occupation || "",
                    location: generated.location || "",
                    archetype: generated.archetype || "",
                    bio: generated.bio || "",
                    traits: Array.isArray(generated.traits) ? generated.traits.join(", ") : "",
                    goal: generated.goal || "",
                    attitude: generated.attitude || "",
                    family_status: generated.family_status || "",
                    education_level: generated.education_level || "",
                    income_level: generated.income_level || "",
                    lifestyle: generated.lifestyle || "",
                    category_products: Array.isArray(generated.category_products) ? generated.category_products.join(", ") : (generated.category_products || ""),
                    product_relationship: generated.product_relationship || "",
                    category_habits: generated.category_habits || "",
                  })
                  setShowGenerated(true)
                } catch (e: any) {
                  toast({ title: "Generation failed", description: e?.message || "Please try again." , variant: "destructive"})
                  setShowGenerated(true)
                }
              }}
            >
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

              <div className="space-y-2">
                <Label htmlFor="attitude">Attitude Toward Topic</Label>
                <Input id="attitude" value={personaForm.attitude} onChange={(e) => handlePersonaChange("attitude", e.target.value)} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="family_status">Family Status</Label>
                  <Input id="family_status" value={personaForm.family_status} onChange={(e) => handlePersonaChange("family_status", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="education_level">Education Level</Label>
                  <Input id="education_level" value={personaForm.education_level} onChange={(e) => handlePersonaChange("education_level", e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="income_level">Income Level</Label>
                  <Input id="income_level" value={personaForm.income_level} onChange={(e) => handlePersonaChange("income_level", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category_products">Category Products (comma-separated)</Label>
                  <Input id="category_products" value={personaForm.category_products} onChange={(e) => handlePersonaChange("category_products", e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lifestyle">Lifestyle</Label>
                <Textarea id="lifestyle" rows={3} value={personaForm.lifestyle} onChange={(e) => handlePersonaChange("lifestyle", e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="product_relationship">Product Relationship</Label>
                <Textarea id="product_relationship" rows={3} value={personaForm.product_relationship} onChange={(e) => handlePersonaChange("product_relationship", e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category_habits">Category Habits</Label>
                <Textarea id="category_habits" rows={3} value={personaForm.category_habits} onChange={(e) => handlePersonaChange("category_habits", e.target.value)} />
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


