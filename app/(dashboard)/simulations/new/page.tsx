"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { PersonaCard } from "@/components/persona-card"
import { ArrowLeft, ArrowRight, Upload } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { usePersonas } from "@/lib/usePersonas"
import { CreatePersonaDialog } from "@/components/create-persona-dialog"

export default function NewSimulationPage() {
  const [step, setStep] = useState(1)
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([])
  const [openPersonaModal, setOpenPersonaModal] = useState(false)
  const router = useRouter()
  const { personas, loading, error } = usePersonas()

  const togglePersona = (id: string) => {
    setSelectedPersonas((prev) => (prev.includes(id) ? prev.filter((personaId) => personaId !== id) : [...prev, id]))
  }

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 4))
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1))
  
  const handleSavePersona = (personaData: any) => {
    console.log("Save persona:", personaData)
    // Here you would implement the save functionality
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Create New Simulation</h1>
      </div>

      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex justify-between">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  step >= i ? "bg-primary text-white" : "bg-gray-200 text-gray-500"
                }`}
              >
                {i}
              </div>
              <span className="mt-2 text-xs text-gray-500">
                {i === 1 ? "Study Details" : i === 2 ? "Participants" : i === 3 ? "Discussion Guide" : "Settings"}
              </span>
            </div>
          ))}
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Study Details</CardTitle>
              <CardDescription>Set up the basic information for your simulation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="studyTitle">Study Title</Label>
                <Input id="studyTitle" placeholder="e.g., New Product Concept Testing" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="studyType">Study Type</Label>
                <Select defaultValue="focus-group">
                  <SelectTrigger>
                    <SelectValue placeholder="Select study type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="focus-group">Focus Group</SelectItem>
                    <SelectItem value="idi">In-Depth Interview</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Simulation Mode</Label>
                <RadioGroup defaultValue="ai-both">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ai-both" id="ai-both" />
                    <Label htmlFor="ai-both">AI Moderator + AI Participants</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="human-mod" id="human-mod" />
                    <Label htmlFor="human-mod">Human Moderator + AI Participants</Label>
                  </div>
                </RadioGroup>
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
              <CardTitle>Select Participants</CardTitle>
              <CardDescription>Choose AI personas to participate in your simulation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex justify-end">
                <CreatePersonaDialog
                  open={openPersonaModal}
                  onOpenChange={setOpenPersonaModal}
                  onSave={handleSavePersona}
                />
              </div>

              {loading ? (
                <div className="p-4 text-center text-gray-500">Loading personas...</div>
              ) : error ? (
                <div className="p-4 text-center text-red-500">{error}</div>
              ) : (
                <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
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
              )}
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
              <CardTitle>Topic and Discussion Guide</CardTitle>
              <CardDescription>Set up the topic and questions for your simulation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="topic">Topic/Stimulus</Label>
                <Input id="topic" placeholder="e.g., New snack flavor launch" />
              </div>

              <div className="space-y-2">
                <Label>Upload Media (optional)</Label>
                <div className="flex h-32 cursor-pointer items-center justify-center rounded-md border border-dashed border-gray-300 hover:bg-gray-50">
                  <div className="flex flex-col items-center space-y-2 text-center">
                    <Upload className="h-6 w-6 text-gray-400" />
                    <span className="text-sm text-gray-500">Click to upload or drag and drop</span>
                    <span className="text-xs text-gray-400">PNG, JPG, PDF up to 10MB</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="questions">Discussion Questions</Label>
                <Textarea
                  id="questions"
                  placeholder="Enter your discussion questions here..."
                  rows={5}
                  defaultValue={
                    "1. What are your initial impressions of this product concept?\n2. How would you describe this product to a friend?\n3. What concerns, if any, would you have about trying this product?"
                  }
                />
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
              <CardTitle>Simulation Settings</CardTitle>
              <CardDescription>Configure how your simulation will run</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="turn-based">Turn-based simulation</Label>
                <Switch id="turn-based" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="turns">Number of turns</Label>
                <Select defaultValue="10">
                  <SelectTrigger>
                    <SelectValue placeholder="Select number of turns" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 turns</SelectItem>
                    <SelectItem value="10">10 turns</SelectItem>
                    <SelectItem value="15">15 turns</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md bg-gray-50 p-4">
                <h3 className="mb-2 font-medium">Simulation Summary</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>Study Type: Focus Group</li>
                  <li>Mode: AI Moderator + AI Participants</li>
                  <li>Participants: {selectedPersonas.length} selected</li>
                  <li>Topic: New snack flavor launch</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <Button variant="outline" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={() => router.push("/simulations/1")}>Launch Simulation</Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  )
}
