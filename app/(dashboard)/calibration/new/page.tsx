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
import { CreatePersonaDialog } from "@/components/create-persona-dialog"
import { CalibrationSession } from "@/utils/types"
export default function NewCalibrationPage() {
  const [step, setStep] = useState(1)
  const [calibrationSession, setCalibrationSession] = useState<CalibrationSession>({
    status: 'in_progress',
    user_id: '' // This will be set when the user is authenticated
  })
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([])
  const router = useRouter()
  const [openPersonaModal, setOpenPersonaModal] = useState(false)
  const { personas, loading, error } = usePersonas()
  const [realParticipants, setRealParticipants] = useState<string[]>([])

  const togglePersona = (id: string) => {
    // Calculate the new array first
    const newSelectedPersonas = selectedPersonas.includes(id) 
      ? selectedPersonas.filter(personaId => personaId !== id) 
      : [...selectedPersonas, id];
      
    // Use it for both state updates
    setSelectedPersonas(newSelectedPersonas);
    console.log('togglePersona', personas, newSelectedPersonas, calibrationSession);
    setCalibrationSession({...calibrationSession, selected_persona_ids: newSelectedPersonas});
  }

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 5))
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1))

  const handleSubmit = async () => {
    // In a real app, we would submit the form data here
    console.log('handleSubmit', calibrationSession)
    // create a new object with the calibrationSession object but with the transcript_participants property removed
    let sendObject = {
      ...calibrationSession,
    }
    delete sendObject.transcript_participants;
    console.log('sendObject', sendObject)
    // add code to call post request in api/calibration_sessions/create/route.ts
    const response = await fetch('/api/calibration_sessions/create', {
      method: 'POST',
      body: JSON.stringify(sendObject)
    })
    if (response.ok) {
      console.log('response', response)
      router.push("/calibration/1")
    }
    // router.push("/calibration/1")
  }

  const extractSpeakerNames = (transcript: string): string[] => {
    const speakerRegex = /^([A-Z][a-zA-Z0-9 _-]{1,30}):/gm;
    const namesSet = new Set<string>();

    let match;
    while ((match = speakerRegex.exec(transcript)) !== null) {
      const name = match[1].trim();
      if (name.toLowerCase() !== 'moderator' && name.toLowerCase() !== 'facilitator') {
        namesSet.add(name);
      }
    }
    setRealParticipants(Array.from(namesSet));
    setCalibrationSession({ ...calibrationSession, transcript_text: transcript });
    return Array.from(namesSet);
  }

  const extractParticipantNames = (participants: string) => {
  
    const participantsArray = participants
    .split('\n')                    // Split the text by newlines
    .map(name => name.trim())        // Trim spaces from each line
    .filter(name => name.length > 0); // Remove empty lines
    setRealParticipants(participantsArray);
    console.log('namesSet11',participantsArray);
  }
  
  const handleParticipantMapping = (personaId: string, participantId: string) => {
    setCalibrationSession({...calibrationSession, persona_mapping: {...calibrationSession.persona_mapping, [personaId]: participantId}})
    console.log('handleParticipantMapping', calibrationSession)
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
                <Input id="studyTitle" placeholder="e.g., Plant-based Snack Focus Group" onChange={(e) => setCalibrationSession({...calibrationSession, title: e.target.value})} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="topic">Topic</Label>
                <Input id="topic" placeholder="e.g., Consumer preferences for plant-based snacks" onChange={(e) => setCalibrationSession({...calibrationSession, topic: e.target.value})} />
              </div>

              {/* <div className="space-y-2">
                <Label htmlFor="notes">Optional Notes</Label>
                <Textarea id="notes" placeholder="Add any additional context about the study..." rows={4} onChange={(e) => setCalibrationSession({...calibrationSession, notes: e.target.value})} />
              </div> */}

              <div className="space-y-2">
                <Label>Upload Media (coming soon!)</Label>
                {/* <Label>Upload Media (optional)</Label> */}
                <div className="flex h-32 cursor-pointer items-center justify-center rounded-md border border-dashed border-gray-300 hover:bg-gray-50">
                  <div className="flex flex-col items-center space-y-2 text-center">
                    <Upload className="h-6 w-6 text-gray-400" />
                    <span className="text-sm text-gray-500">Click to upload or drag and drop</span>
                    <span className="text-xs text-gray-400">PNG, JPG, PDF up to 10MB</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Discussion Questions</Label>
                <Textarea id="notes" placeholder="Discussion Questions about the study..." rows={4} onChange={(e) => setCalibrationSession({...calibrationSession, discussion_questions: e.target.value.split('\n')})} />
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
                  onChange={(e) => { 
                    setCalibrationSession({...calibrationSession, transcript_text: e.target.value})
                    const names = extractSpeakerNames(e.target.value);
                    console.log('names', names);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="participants">We detected participants</Label>
                <Textarea
                  id="participants"
                  placeholder="Paste your participants here..."
                  rows={5}
                  value={realParticipants.map((participant) => participant).join('\n')}
                  className="font-mono text-sm"
                  onChange={(e) => {
                    extractParticipantNames(e.target.value);
                  }}
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
              <div className="mb-4 flex justify-end">
                <CreatePersonaDialog
                  open={openPersonaModal}
                  onOpenChange={setOpenPersonaModal}
                />
              </div>
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
              <div className="space-y-4">
                {getSelectedPersonas().map((persona: any) => (
                  <div key={persona.id} className="flex gap-4">
                    {/* Left: AI Persona */}
                    <div className="rounded-md border p-4 h-full flex-1 flex flex-col">
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
                    {/* Right: Mapping */}
                    <div className="rounded-md border p-4 h-full flex-1 flex flex-col">
                      <div className="space-y-3 flex-1 flex flex-col">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{persona.name}</span>
                          <span className="text-sm text-gray-500">maps to:</span>
                        </div>
                        <Select
                          value={calibrationSession?.persona_mapping?.[persona.id] || ""}
                          onValueChange={(value) => handleParticipantMapping(persona.id, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a participant" />
                          </SelectTrigger>
                          <SelectContent>
                            {realParticipants.map((participant) => (
                              <SelectItem key={participant} value={participant}>
                                {participant}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                       
                      </div>
                    </div>
                  </div>
                ))}
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
                  <li>Study Title: {calibrationSession.title}</li>
                  <li>Topic: {calibrationSession.topic}</li>
                  <li>Participants: {selectedPersonas.length} selected</li>
                  <li>Participant Mappings: {Object.keys(calibrationSession?.persona_mapping || {}).length} mapped</li>
                  {/* <li>Transcript: {calibrationSession.transcript_text?.length} words</li> */}
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
