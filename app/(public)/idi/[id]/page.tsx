"use client"
import { useParams } from "next/navigation";
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Persona, Simulation, SimulationMessage } from "@/utils/types";

// Interface for the Simulation data
interface SimulationResponse {
  simulation: Simulation;
  personas: Persona[];
  error?: string;
}

export default function PublicIDIPage() {
  const params = useParams();
  const simulationId = params.id as string;

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [simulationData, setSimulationData] = useState<SimulationResponse | null>(null)
  const [simulationMessages, setSimulationMessages] = useState<SimulationMessage[]>([])
  const [formattedMessages, setFormattedMessages] = useState<{
    speaker: string;
    text: string;
    time: string;
    sender_id?: string | null;
    sender_type?: string;
  }[]>([])

  // Color palette for personas (10 colors)
  const personaColors = [
    '#E91E63', '#673AB7', '#3F51B5', '#2196F3', '#00BCD4',
    '#009688', '#4CAF50', '#FF9800', '#F44336', '#795548'
  ];

  // Function to get color for a persona
  const getPersonaColor = (personaId: string, personas: Persona[]) => {
    const index = personas.findIndex(p => p.id === personaId);
    return index !== -1 ? personaColors[index % personaColors.length] : personaColors[0];
  };

  useEffect(() => {
    const fetchSimulationData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/public/idi/${params.id}`);
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        setSimulationData(data);
        setError(null);
      } catch (err: any) {
        console.error("Failed to fetch simulation:", err);
        setError(err.message || "Failed to load simulation data");
        setSimulationData(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSimulationData();
  }, [simulationId]);

  // Call fetchSimulationMessages when simulation data is loaded
  // useEffect(() => {
  //   if (simulationData?.simulation?.id) {
  //     fetchSimulationMessages(simulationData.simulation.id);
  //   }
  // }, [simulationData]);

  // Function to fetch simulation messages
  // const fetchSimulationMessages = async (simId: string) => {
  //   try {
  //     const response = await fetch(`/api/public/idi-messages/${simId}`);
      
  //     if (!response.ok) {
  //       throw new Error(`Error fetching messages: ${response.status}`);
  //     }
      
  //     const data = await response.json();
      
  //     if (data.error) {
  //       console.error("API error:", data.error);
  //       return;
  //     }
      
  //     // sort messages by created_at date
  //     data.messages.sort((a: SimulationMessage, b: SimulationMessage) => 
  //       new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  //     );
      
  //     // Store the raw messages
  //     setSimulationMessages(data.messages || []);
      
  //     // Create a map of persona IDs to names
  //     const personaIdToNameMap = (data.personas || []).reduce((map: Record<string, string>, persona: { id: string, name: string }) => {
  //       map[persona.id] = persona.name;
  //       return map;
  //     }, {});
      
  //     // Format messages for display
  //     const formatted = (data.messages || []).map((msg: SimulationMessage) => {
  //       let speakerName = "Unknown";
        
  //       if (msg.sender_type === 'moderator') {
  //         speakerName = 'Interviewer';
  //       } else if (msg.sender_id && personaIdToNameMap[msg.sender_id]) {
  //         speakerName = personaIdToNameMap[msg.sender_id];
  //       }
        
  //       // Format timestamp
  //       const timestamp = msg.created_at 
  //         ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  //         : `${msg.turn_number}`;
        
  //       return {
  //         speaker: speakerName,
  //         text: msg.message,
  //         time: timestamp,
  //         sender_id: msg.sender_id,
  //         sender_type: msg.sender_type
  //       };
  //     });
      
  //     setFormattedMessages(formatted);
  //   } catch (err: any) {
  //     console.error("Error fetching simulation messages:", err);
  //   }
  // };

  if (isLoading) {
    return <div className="flex items-center justify-center h-[70vh]">Loading interview data...</div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
        <div className="text-xl font-semibold text-red-500">Error loading interview</div>
        <div className="text-gray-500">{error}</div>
      </div>
    );
  }

  if (!simulationData || !simulationData.simulation) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
        <div className="text-xl font-semibold">Interview not found</div>
      </div>
    );
  }

  const { simulation, personas } = simulationData;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{simulation.topic}</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{new Date(simulation.created_at).toLocaleDateString()}</span>
              <span>•</span>
              <span>In-Depth Interview</span>
              <Badge variant={simulation.status === "Completed" ? "default" : "secondary"}>
                {simulation.status}
              </Badge>
            </div>
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Participant Info - Side Column */}
          <div className="col-span-1 lg:col-span-3 space-y-4">
            <Card className="h-fit">
              <CardContent className="p-4">
                <h2 className="font-semibold mb-4">Participant</h2>
                {personas.length > 0 && (
                  <div className="space-y-4">
                    {personas.map((participant) => (
                      <div key={participant.id} className="flex items-start gap-2">
                        <div 
                          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-white text-xs font-medium"
                          style={{ backgroundColor: getPersonaColor(participant.id, personas) }}
                        >
                          {participant.name[0]}
                        </div>
                        <div>
                          <h3 className="font-medium">{participant.name}</h3>
                          <p className="text-sm text-gray-500">
                            {participant.age} • {participant.occupation}
                          </p>
                          <p className="mt-1 text-xs text-gray-600">{participant.bio}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Chat Window - Main Content */}
          <div className="col-span-1 lg:col-span-9">
            <Card className="h-full">
              <CardContent className="p-4">
                <h2 className="font-semibold mb-4">Interview Transcript</h2>
                <div className="space-y-6">
                  {formattedMessages.map((message, i) => {
                    const isModeratorMessage = message.speaker === "Interviewer";
                    const personaColor = !isModeratorMessage && message.sender_id 
                      ? getPersonaColor(message.sender_id, personas) 
                      : '#9238FF';
                    
                    return (
                      <div key={i} className={`flex gap-4 items-end ${isModeratorMessage ? "flex-row-reverse" : ""}`}>
                        <div 
                          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-white font-medium"
                          style={{ backgroundColor: personaColor }}
                        >
                          {isModeratorMessage ? "I" : message.speaker[0]}
                        </div>
                        <div className={`flex-1 ${isModeratorMessage ? "text-right" : ""}`}>
                          <div className={`inline-block rounded-lg px-4 py-2 max-w-[80%] ${
                            isModeratorMessage 
                              ? "bg-primary text-primary-foreground" 
                              : "bg-muted"
                          }`}>
                            {!isModeratorMessage && (
                              <div className="flex items-center justify-between mb-1">
                                <span 
                                  className="font-semibold text-sm"
                                  style={{ color: personaColor }}
                                >
                                  {message.speaker}
                                </span>
                                <span className="text-xs text-gray-500 ml-2">{message.time}</span>
                              </div>
                            )}
                            {isModeratorMessage && (
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-primary-foreground/70">{message.time}</span>
                                <span className="font-semibold text-sm text-primary-foreground ml-2">
                                  Interviewer
                                </span>
                              </div>
                            )}
                            <p className="text-sm">{message.text}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
