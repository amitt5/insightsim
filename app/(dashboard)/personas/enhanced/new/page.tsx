"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

export default function EnhancedPersonasNewPage() {
  const [basicDemographics, setBasicDemographics] = useState("")
  const [behaviorsAttitudes, setBehaviorsAttitudes] = useState("")
  const [researchContext, setResearchContext] = useState("")

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
            <Button type="button" className="w-full sm:w-auto">
              Generate Persona
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


