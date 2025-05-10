"use client"

import { Label } from "@/components/ui/label"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Lightbulb, Check, X } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { useParams } from "next/navigation"
import { CalibrationSession, Persona, Simulation } from "@/utils/types"
import { prepareInitialPrompt, buildPersonaImprovementPrompt } from "@/utils/preparePrompt";
import { set } from "date-fns"

export default function CalibrationDetailPage() {

  const params = useParams(); // Use useParams() to get the id
  const calibrationId = params.calibration_id as string;
  const [activeTab, setActiveTab] = useState("real")
  const [suggestions, setSuggestions] = useState([
    {
      id: 1,
      original: "Health-conscious",
      suggested: "Health-focused with emphasis on natural ingredients",
      accepted: false,
      rejected: false,
    },
    {
      id: 2,
      original: "Tech-savvy",
      suggested: "Tech-savvy with interest in innovative products",
      accepted: false,
      rejected: false,
    },
    {
      id: 3,
      original: "Budget-aware",
      suggested: "Value-oriented but willing to pay premium for quality",
      accepted: false,
      rejected: false,
    },
  ])

  // Mock data
  const calibration = {
    id: params.id,
    title: "Snack Product Focus Group",
    topic: "Plant-based snack preferences",
    date: "2025-04-15",
    status: "Ready to Compare",
    comparisonSummary: [
      "AI personas accurately captured the health-consciousness theme but overemphasized professional contexts",
      "Real participants were more specific about their frustrations finding good options",
      "AI personas used more technical language than real participants",
      "Price sensitivity was present in both but expressed differently",
      "Real participants shared more personal anecdotes and specific examples",
    ],
    personas: [
      {
        id: "1",
        name: "Emma Chen",
        traits: ["Health-conscious", "Tech-savvy", "Budget-aware"],
      },
      {
        id: "2",
        name: "David Kim",
        traits: ["Early adopter", "Analytical", "Convenience-focused"],
      },
      {
        id: "3",
        name: "Sarah Johnson",
        traits: ["Quality-focused", "Practical", "Family-oriented"],
      },
      {
        id: "4",
        name: "Michael Rodriguez",
        traits: ["Value-conscious", "Detail-oriented", "Skeptical"],
      },
    ],
  }

  const [calibrationSession, setCalibrationSession] = useState<CalibrationSession | null>(null)
  const [calibrationPersonas, setCalibrationPersonas] = useState<Persona[]>([])
  const [simulatedTranscript, setSimulatedTranscript] = useState<any[]>([])

  const handleAccept = (id: number) => {
    setSuggestions(suggestions.map((s) => (s.id === id ? { ...s, accepted: true, rejected: false } : s)))
  }

  const generateAiTranscript = () => {
    console.log('generateAiTranscript', calibration)
    runSimulation();
  }

  const compareTranscripts = async() => {
    console.log('compareTranscripts', calibrationSession)

    const prompt = buildPersonaImprovementPrompt(calibrationSession?.transcript_text || '',calibrationSession?.simulated_transcript || '', calibrationPersonas,calibrationSession?.persona_mapping || {} );
    console.log('prompt-compareTranscripts', prompt);

    const savedResponse = getSavedOpenAIResponse();
    if (savedResponse) {
      console.log("Loaded saved response:", savedResponse);
      const parsedSavedResponse: any = parseSimulationResponse(savedResponse.reply);
      console.log('Parsed saved response:', parsedSavedResponse);
      saveComparisonSummary(parsedSavedResponse.transcript_differences);
      savePersonaImprovement(parsedSavedResponse.persona_improvements);
    } else {
      // Make the request to OpenAI and save the result
      await makeOpenAIRequest(prompt);
      // saveOpenAIResponse(response);
    }
  }

  const saveComparisonSummary = async(transcript_differences: string[]) => {
    console.log('savePersonaImprovement', calibrationSession)
    // setCalibrationSession({
    //   ...calibrationSession,
    //   user_id: calibrationSession?.user_id || "",
    //   comparison_summary: transcript_differences || [],
    //   status: "completed"
    // })

    const response = await fetch(`/api/calibration_sessions/${calibrationSession?.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...calibrationSession,
        user_id: calibrationSession?.user_id || "",
        comparison_summary: transcript_differences || [],
        status: "completed"
      }),
    });
    if (response.ok) {
      console.log('response', response)
      fetchCalibrationSessionData();
    }
  }

  const makeOpenAIRequest = async(prompt: any) => {
    console.log('compareTranscripts', calibrationSession)


    try {
      const res = await fetch('/api/run-simulation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: prompt,
        }),
      });
      
      if (!res.ok) {
        throw new Error(`Error running simulation: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('API response:', data);
      saveOpenAIResponse(data);
      
      if (data.reply) {
        // Parse the response into messages
        
        const parsedResponse: any = parseSimulationResponse(data.reply);
        console.log('Parsed messages111:', parsedResponse);
        saveComparisonSummary(parsedResponse.transcript_differences);
        savePersonaImprovement(parsedResponse.persona_improvements);

      }
    } catch (error) {
      console.error("Error running simulation:", error);
    }
  }

  

  const saveOpenAIResponse = (response: any) => {
    if (typeof window !== "undefined") {
      // Convert response to JSON and save to localStorage
      localStorage.setItem('openAIResponse', JSON.stringify(response));
    }
  }

  const getSavedOpenAIResponse = () => {
    if (typeof window !== "undefined") {
      const savedResponse = localStorage.getItem('openAIResponse');
      return savedResponse ? JSON.parse(savedResponse) : null;
    }
    return null;
  }

  const savePersonaImprovement = async(persona_improvements: PersonaImprovement[]) => {
    console.log('savePersonaImprovement', persona_improvements)
    
    try {
      // Prepare the data for API call
      const improvementsToSave = persona_improvements.map(improvement => ({
        persona_id: improvement.persona_id,
        calibration_id: calibrationSession?.id,
        updated_prompt: improvement.suggested_improvements
      }));
      
      // Make the API call
      const response = await fetch('/api/persona_versions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(improvementsToSave),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save persona improvements');
      }
      
      const result = await response.json();
      console.log('Saved persona improvements:', result.data);
      
      // Optionally update UI or show success message
      // setSuccessMessage('Persona improvements saved successfully');
      
      return result.data;
    } catch (error) {
      console.error('Error saving persona improvements:', error);
      // Optionally show error in UI
      // setErrorMessage('Failed to save persona improvements');
      throw error;
    }
  }

  const runSimulation = async () => {
    console.log('runSimulationCalled', calibrationSession);
    if(calibrationSession && calibrationSession.title) {
      const simulation : Simulation = {
        id: calibrationSession.id || '',
        study_title: calibrationSession.title,
        study_type: "focus-group",
        mode: "ai-both",
        discussion_questions: calibrationSession.discussion_questions,
        turn_based: true,
        num_turns: 5,
        user_id: calibrationSession.user_id || '',
        status: "Running",
        created_at: calibrationSession.created_at || ''
      }
      const prompt = prepareInitialPrompt(simulation, calibrationPersonas);
      console.log('prompt123', prompt);
    
      try {
        const res = await fetch('/api/run-simulation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: prompt,
          }),
        });
        
        if (!res.ok) {
          throw new Error(`Error running simulation: ${res.status}`);
        }
        
        const data = await res.json();
        console.log('API response:', data);
        
        if (data.reply) {
          // Parse the response into messages
          
          const parsedMessages = parseSimulationResponse(data.reply);
          console.log('Parsed messages111:', parsedMessages);
          // setSimulatedTranscript(parsedMessages)
          formatAndSaveTranscript(parsedMessages)
        }
      } catch (error) {
        console.error("Error running simulation:", error);
      }
    }
  }


  const formatAndSaveTranscript = async(parsedMessages: any[]) => {
    if (!parsedMessages.length) return;
    // Build the transcript string
    const transcript = parsedMessages.map(m => `${m.name}: ${m.message}`).join("\n");
    console.log('copyTranscript', parsedMessages);
    console.log('copyTranscript1', transcript);
    setCalibrationSession({
      ...calibrationSession,
      user_id: calibrationSession?.user_id || "",
      simulated_transcript: transcript,
      status: "completed"
    });
    console.log('calibrationSession123', calibrationSession);

    const response = await fetch(`/api/calibration_sessions/${calibrationSession?.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...calibrationSession,
        user_id: calibrationSession?.user_id || "",
        simulated_transcript: transcript,
        status: "completed"
      }),
    });
    if (response.ok) {
      console.log('response', response)
      fetchCalibrationSessionData();
    }

  };

  // Function to parse the simulation response
  const parseSimulationResponse = (responseString: string) => {
    try {
      // Remove the initial "=" and any whitespace if it exists
      const cleanedString = responseString.trim()
      .replace(/^```json\s*/i, '') // remove leading ```json
      .replace(/^```\s*/i, '')     // or just ```
      .replace(/```$/, '')
      .replace(/^\s*=\s*/, '');
      const parsed = JSON.parse(cleanedString);
      // setMessages(parsed);
      return parsed;
    } catch (error) {
      console.error("Error parsing simulation response:", error);
      return [];
    }
  };

  const handleReject = (id: number) => {
    setSuggestions(suggestions.map((s) => (s.id === id ? { ...s, accepted: false, rejected: true } : s)))
  }

  const handleSuggestedChange = (id: number, value: string) => {
    setSuggestions(
      suggestions.map((s) => (s.id === id ? { ...s, suggested: value, accepted: false, rejected: false } : s)),
    )
  }
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCalibrationSessionData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/calibration_sessions/${params.id}`);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setCalibrationSession(data.calibrationSession);
      setCalibrationPersonas(data.personas);
      setRealTranscript(parseTranscript(data?.calibrationSession?.transcript_text || ''))
      if(data?.calibrationSession?.simulated_transcript) {
        setSimulatedTranscript(parseTranscript(data?.calibrationSession?.simulated_transcript || ''))
      }
    } catch (err: any) {
      console.error("Failed to fetch simulation:", err);
      setError(err.message || "Failed to load simulation data");
      setCalibrationSession(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCalibrationSessionData();
  }, [calibrationId]);

  const [realTranscript, setRealTranscript] = useState<TranscriptEntry[]>([])
  const [aiTranscript, setAiTranscript] = useState<any[]>([])
  const [comparisonSummary, setComparisonSummary] = useState<string[]>([])
  const [personas, setPersonas] = useState<any[]>([])

interface TranscriptEntry {
  speaker: string;
  text: string;
}

interface PersonaImprovement {
  persona_id: string;
  suggested_improvements: string;
}



/**
 * Parses a plain-text transcript into structured entries.
 * Each line must follow the format: Speaker Name: text
 *
 * @param transcriptText - Raw transcript as a string
 * @returns Array of structured transcript entries
 */
function parseTranscript(transcriptText: string): TranscriptEntry[] {
  const lines = transcriptText.trim().split('\n');
  const entries: TranscriptEntry[] = [];

  for (const line of lines) {
    const match = line.match(/^([^:]+):\s*(.+)$/);
    if (match) {
      const speaker = match[1].trim();
      const text = match[2].trim();
      entries.push({ speaker, text });
    }
  }
  return entries;
}


  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{calibration.title}</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>{calibration.date}</span>
            <span>•</span>
            <span>{calibration.topic}</span>
            <Badge variant="default">{calibration.status}</Badge>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="real">Real Transcript</TabsTrigger>
          <TabsTrigger value="ai">AI Transcript</TabsTrigger>
          <TabsTrigger value="comparison">Comparison Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="real">
          <Card>
            <CardHeader>
              <CardTitle>Real Research Transcript</CardTitle>
              <CardDescription>Transcript from your actual research session</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {realTranscript.map((message, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      {message.speaker === "Moderator" ? "M" : "P"}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{message.speaker}</span>
                      </div>
                      <p className="mt-1 text-gray-700">{message.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle>AI Simulation Transcript</CardTitle>
              <CardDescription>Generated transcript from AI personas</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Show button if aiTranscript is null or empty */}
              {(!calibrationSession?.simulated_transcript) && (
                <button
                  className="mb-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
                  onClick={() => generateAiTranscript()}
                >
                  Generate AI transcript
                </button>
              )}
              {(simulatedTranscript && simulatedTranscript.length) &&
              <div className="space-y-6">
                {simulatedTranscript.map((message, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      {message.speaker === "Moderator" ? "M" : message.speaker[0]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{message.speaker}</span>
                      </div>
                      <p className="mt-1 text-gray-700">{message.text}</p>
                    </div>
                  </div>
                ))}
              </div>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle>Comparison Summary</CardTitle>
              <CardDescription>Analysis of differences between real and AI transcripts</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Show button if aiTranscript is null or empty */}
              {/* {(!calibrationSession?.comparison_summary) && ( */}
                <button
                  className="mb-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
                  onClick={() => compareTranscripts()}
                >
                  Compare transcripts
                </button>
              {/* )} */}
              {(calibrationSession?.comparison_summary && calibrationSession?.comparison_summary.length) &&
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-3 text-lg font-medium">Key Differences</h3>
                    <ul className="space-y-2">
                      {calibrationSession?.comparison_summary.map((point, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-xs">
                            {i + 1}
                          </span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-8">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Suggested Persona Improvements</h3>
                      <Button variant="outline" className="gap-2">
                        <Lightbulb className="h-4 w-4" />
                        Suggest Prompt Changes
                      </Button>
                    </div>

                    <div className="mt-4 space-y-4">
                      {suggestions.map((suggestion) => (
                        <div key={suggestion.id} className="rounded-md border p-4">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="font-medium">
                              Original trait: <span className="text-gray-600">{suggestion.original}</span>
                            </span>
                            <div className="flex gap-2">
                              <Button
                                variant={suggestion.accepted ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleAccept(suggestion.id)}
                                className="gap-1"
                              >
                                <Check className="h-3 w-3" />
                                Accept
                              </Button>
                              <Button
                                variant={suggestion.rejected ? "destructive" : "outline"}
                                size="sm"
                                onClick={() => handleReject(suggestion.id)}
                                className="gap-1"
                              >
                                <X className="h-3 w-3" />
                                Reject
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`suggestion-${suggestion.id}`}>Suggested improvement:</Label>
                            <Textarea
                              id={`suggestion-${suggestion.id}`}
                              value={suggestion.suggested}
                              onChange={(e) => handleSuggestedChange(suggestion.id, e.target.value)}
                              className={
                                suggestion.accepted
                                  ? "border-green-500"
                                  : suggestion.rejected
                                    ? "border-red-300 line-through"
                                    : ""
                              }
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 flex justify-end">
                      <Button>Save Persona Updates</Button>
                    </div>
                  </div>
                </div>
              }
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
