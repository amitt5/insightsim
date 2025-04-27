"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PersonaCard } from "@/components/persona-card"
import { ArrowLeft, ArrowRight, Upload, UserCircle } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { usePersonas } from "@/lib/usePersonas"

export default function NewCalibrationPage() {
  const [step, setStep] = useState(1)
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([])
  const [participantMappings, setParticipantMappings] = useState<Record<string, string>>({})
  const [mappingNotes, setMappingNotes] = useState<Record<string, string>>({})
  const router = useRouter()

  // // Mock personas data
  const personas1 = [
    {
      id: "1",
      name: "Emma Chen",
      age: 34,
      gender: "Female",
      occupation: "Marketing Manager",
      traits: ["Health-conscious", "Tech-savvy", "Budget-aware"],
      archetype: "Busy Professional",
    },
    {
      id: "2",
      name: "David Kim",
      age: 28,
      gender: "Male",
      occupation: "Software Developer",
      traits: ["Early adopter", "Analytical", "Convenience-focused"],
      archetype: "Tech Enthusiast",
    },
    {
      id: "3",
      name: "Sarah Johnson",
      age: 42,
      gender: "Female",
      occupation: "Healthcare Administrator",
      traits: ["Quality-focused", "Practical", "Family-oriented"],
      archetype: "Careful Planner",
    },
    {
      id: "4",
      name: "Michael Rodriguez",
      age: 31,
      gender: "Male",
      occupation: "Financial Analyst",
      traits: ["Value-conscious", "Detail-oriented", "Skeptical"],
      archetype: "Rational Buyer",
    },
  ]

  const { personas, loading, error } = usePersonas()


  // Mock real participants extracted from transcript
  const realParticipants = [
    { id: "p1", name: "Jennifer W.", gender: "Female", age: "30s", notes: "Mentioned having children" },
    { id: "p2", name: "Robert T.", gender: "Male", age: "20s", notes: "Tech background" },
    { id: "p3", name: "Lisa M.", gender: "Female", age: "40s", notes: "Health-focused" },
    { id: "p4", name: "Carlos G.", gender: "Male", age: "30s", notes: "Price-conscious" },
    { id: "p5", name: "Aisha P.", gender: "Female", age: "20s", notes: "Mentioned social media" },
  ]

  const togglePersona = (id: string) => {
    console.log('togglePersona', personas)
    setSelectedPersonas((prev) => (prev.includes(id) ? prev.filter((personaId) => personaId !== id) : [...prev, id]))
  }

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 5))
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1))

  const handleSubmit = () => {
    // In a real app, we would submit the form data here
    router.push("/calibration/1")
  }

  const handleParticipantMapping = (personaId: string, participantId: string) => {
    setParticipantMappings((prev) => ({
      ...prev,
      [personaId]: participantId,
    }))
  }

  const handleMappingNote = (personaId: string, note: string) => {
    setMappingNotes((prev) => ({
      ...prev,
      [personaId]: note,
    }))
  }

  const getSelectedPersonas = () => {
    return personas.filter((persona: any) => selectedPersonas.includes(persona.id))
  }

  

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">New Calibration</h1>
      </div>

      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex justify-between">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  step >= i ? "bg-primary text-white" : "bg-gray-200 text-gray-500"
                }`}
              >
                {i}
              </div>
              <span className="mt-2 text-xs text-gray-500">
                {i === 1
                  ? "Study Metadata"
                  : i === 2
                    ? "Upload Transcript"
                    : i === 3
                      ? "Select Personas"
                      : i === 4
                        ? "Map Participants"
                        : "Simulation Settings"}
              </span>
            </div>
          ))}
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Study Metadata</CardTitle>
              <CardDescription>Enter basic information about your real-world research study</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="studyTitle">Study Title</Label>
                <Input id="studyTitle" placeholder="e.g., Plant-based Snack Focus Group" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="topic">Topic</Label>
                <Input id="topic" placeholder="e.g., Consumer preferences for plant-based snacks" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Optional Notes</Label>
                <Textarea id="notes" placeholder="Add any additional context about the study..." rows={4} />
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button onClick={nextStep}>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Upload Transcript</CardTitle>
              <CardDescription>Provide the transcript from your real-world research</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="transcript">Transcript Text</Label>
                <Textarea
                  id="transcript"
                  placeholder="Paste your transcript here..."
                  rows={15}
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex items-center justify-center">
                <span className="text-xs text-gray-500">— or —</span>
              </div>

              <div className="space-y-2">
                <Label>Upload Transcript File</Label>
                <div className="flex h-32 cursor-pointer items-center justify-center rounded-md border border-dashed border-gray-300 hover:bg-gray-50">
                  <div className="flex flex-col items-center space-y-2 text-center">
                    <Upload className="h-6 w-6 text-gray-400" />
                    <span className="text-sm text-gray-500">Click to upload or drag and drop</span>
                    <span className="text-xs text-gray-400">TXT, DOCX, PDF up to 10MB</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <Button variant="outline" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={nextStep}>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Select Personas</CardTitle>
              <CardDescription>Choose AI personas to match your real-world participants</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {personas.map((persona) => (
                  <PersonaCard
                    key={persona.id}
                    persona={persona}
                    selected={selectedPersonas.includes(persona.id)}
                    onToggle={() => togglePersona(persona.id)}
                    selectable={true}
                  />
                ))}
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <Button variant="outline" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={nextStep}>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Map Participants to Personas</CardTitle>
              <CardDescription>Match each AI persona to a real participant from your transcript</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                {/* Left column: Selected AI personas */}
                <div className="space-y-4">
                  <h3 className="font-medium text-sm text-gray-500 uppercase tracking-wider">AI Personas</h3>
                  {getSelectedPersonas().map((persona: any) => (
                    <div key={persona.id} className="rounded-md border p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <UserCircle className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="font-medium">{persona.name}</h4>
                          <p className="text-sm text-gray-500">
                            {persona.age} • {persona.gender} • {persona.occupation}
                          </p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {persona.traits.map((trait: string, i: number) => (
                              <span
                                key={i}
                                className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800"
                              >
                                {trait}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right column: Mapping interface */}
                <div className="space-y-4">
                  <h3 className="font-medium text-sm text-gray-500 uppercase tracking-wider">Mapping</h3>
                  {getSelectedPersonas().map((persona) => (
                    <div key={persona.id} className="rounded-md border p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{persona.name}</span>
                          <span className="text-sm text-gray-500">maps to:</span>
                        </div>

                        <Select
                          value={participantMappings[persona.id] || ""}
                          onValueChange={(value) => handleParticipantMapping(persona.id, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a participant" />
                          </SelectTrigger>
                          <SelectContent>
                            {realParticipants.map((participant) => (
                              <SelectItem key={participant.id} value={participant.id}>
                                {participant.name} ({participant.gender}, {participant.age})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {participantMappings[persona.id] && (
                          <div className="pt-2">
                            <Label htmlFor={`mapping-note-${persona.id}`} className="text-xs text-gray-500">
                              Optional mapping notes:
                            </Label>
                            <Textarea
                              id={`mapping-note-${persona.id}`}
                              placeholder="e.g., matched by tone and age"
                              className="mt-1 text-sm"
                              rows={2}
                              value={mappingNotes[persona.id] || ""}
                              onChange={(e) => handleMappingNote(persona.id, e.target.value)}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <Button variant="outline" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={nextStep}>
                Save Mapping & Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 5 && (
          <Card>
            <CardHeader>
              <CardTitle>Simulation Settings</CardTitle>
              <CardDescription>Configure how the AI simulation will run</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="turn-based">Turn-based simulation</Label>
                <Switch id="turn-based" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="turns">Number of Turns</Label>
                <Select defaultValue="10">
                  <SelectTrigger>
                    <SelectValue placeholder="Select number of turns" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 turns</SelectItem>
                    <SelectItem value="10">10 turns</SelectItem>
                    <SelectItem value="15">15 turns</SelectItem>
                    <SelectItem value="20">20 turns</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md bg-gray-50 p-4">
                <h3 className="mb-2 font-medium">Calibration Summary</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>Study Title: Plant-based Snack Focus Group</li>
                  <li>Topic: Consumer preferences for plant-based snacks</li>
                  <li>Participants: {selectedPersonas.length} selected</li>
                  <li>Participant Mappings: {Object.keys(participantMappings).length} mapped</li>
                  <li>Transcript: 1,250 words</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <Button variant="outline" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleSubmit}>Run AI Simulation</Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  )
}
