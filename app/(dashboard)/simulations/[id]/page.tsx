"use client"
import { useParams } from "next/navigation";
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, UserCircle, ChevronLeft, ChevronRight } from "lucide-react"

// Interface for the Simulation data
interface Simulation {
  id: string;
  user_id: string;
  study_title: string;
  study_type: "focus-group" | "idi";
  mode: "ai-both" | "human-mod";
  topic?: string;
  stimulus_media_url?: string;
  discussion_questions: string[];
  turn_based: boolean;
  num_turns: number;
  status: "Draft" | "Running" | "Completed";
  created_at: string;
}

// Interface for Persona data
interface Persona {
  id: string;
  name: string;
  age: number;
  occupation: string;
  bio: string;
  [key: string]: any; // For any additional fields
}

// Interface for the API response
interface SimulationResponse {
  simulation: Simulation;
  personas: Persona[];
  error?: string;
}

export default function SimulationViewPage() {
  const params = useParams(); // Use useParams() to get the business_id
  const simulationId = params.simulation_id as string;

  const [activeTab, setActiveTab] = useState("transcript")
  const [isLeftPanelMinimized, setIsLeftPanelMinimized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [simulationData, setSimulationData] = useState<SimulationResponse | null>(null)

  useEffect(() => {
    const fetchSimulationData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/simulations/${params.id}`);
        
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

  // Mock data for discussion, insights, and themes (unchanged)
  const discussion = [
    {
      speaker: "Moderator",
      text: "Welcome everyone to our focus group on a new plant-based snack chip concept. Let's start by going around and sharing your initial impressions of the product image I just showed you.",
      time: "00:00",
    },
    {
      speaker: "Emma Chen",
      text: "I like the packaging design - it clearly communicates that it's plant-based, which is important to me. The green color palette feels fresh and healthy.",
      time: "00:45",
    },
    {
      speaker: "David Kim",
      text: "The shape looks interesting - are those ridges for better dipping? I'm curious about the texture and if it would hold up to thicker dips without breaking.",
      time: "01:20",
    },
    {
      speaker: "Sarah Johnson",
      text: "I'm immediately checking the nutritional information. I see it's high in protein which is great, but I'm concerned about the sodium content for my kids.",
      time: "01:55",
    },
    {
      speaker: "Michael Rodriguez",
      text: "My first thought is about price point. Premium plant-based snacks tend to be expensive. I'd need to know if the value matches the cost before trying it.",
      time: "02:30",
    },
    {
      speaker: "Moderator",
      text: "Great insights. Now, how would each of you describe this product to a friend who hasn't seen it?",
      time: "03:05",
    },
    {
      speaker: "Emma Chen",
      text: "I'd say it's a modern, eco-friendly chip alternative that doesn't compromise on flavor. The kind of snack you can feel good about eating during a busy workday.",
      time: "03:40",
    },
    {
      speaker: "David Kim",
      text: "It's a tech-forward snack - using plant innovation to create something that looks like it has an interesting texture profile. I'd emphasize the uniqueness factor.",
      time: "04:15",
    },
  ];

  const insights = [
    "Packaging clearly communicates plant-based nature, which resonates with health-conscious consumers",
    "Texture and dipping functionality are important considerations for the product experience",
    "Nutritional information is scrutinized, especially by family purchasers",
    "Price sensitivity is high, even among premium snack buyers",
    "Environmental messaging could be strengthened to appeal to eco-conscious consumers",
  ];

  const themes = ["Health", "Value", "Texture", "Innovation", "Sustainability"];

  if (isLoading) {
    return <div className="flex items-center justify-center h-[70vh]">Loading simulation data...</div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
        <div className="text-xl font-semibold text-red-500">Error loading simulation</div>
        <div className="text-gray-500">{error}</div>
        <Button onClick={() => window.history.back()}>Go Back</Button>
      </div>
    );
  }

  if (!simulationData || !simulationData.simulation) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
        <div className="text-xl font-semibold">Simulation not found</div>
        <Button onClick={() => window.history.back()}>Go Back</Button>
      </div>
    );
  }

  const { simulation, personas } = simulationData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{simulation.study_title}</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>{new Date(simulation.created_at).toLocaleDateString()}</span>
            <span>•</span>
            <span>{simulation.mode === 'ai-both' ? 'AI Mod + AI Participants' : 'Human Mod + AI Participants'}</span>
            <Badge variant={simulation.status === "Completed" ? "default" : "secondary"}>{simulation.status}</Badge>
          </div>
        </div>
      </div>

      {/* 3-Column Layout */}
      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-200px)]">
        {/* Left Column - Participants */}
        <div className="col-span-3 overflow-auto">
          <Card className="h-full">
            <CardContent className="p-4">
              <h2 className="font-semibold mb-4">Participants ({personas.length})</h2>
              {personas.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No participants added to this simulation
                </div>
              ) : (
                <div className="space-y-4">
                  {personas.map((participant) => (
                    <div key={participant.id} className="flex items-start gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <UserCircle className="h-6 w-6" />
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

        {/* Middle Column - Chat Window */}
        <div className={`${isLeftPanelMinimized ? 'col-span-8' : 'col-span-6'} overflow-auto transition-all duration-300`}>
          <Card className="h-full flex flex-col">
            <CardContent className="p-4 flex-1 overflow-auto">
              <h2 className="font-semibold mb-4">Discussion</h2>
              <div className="space-y-6">
                {discussion.map((message, i) => (
                  <div key={i} className={`flex gap-4 ${message.speaker === "Moderator" ? "flex-row-reverse" : ""}`}>
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      {message.speaker === "Moderator" ? "M" : message.speaker[0]}
                    </div>
                    <div className={`flex-1 ${message.speaker === "Moderator" ? "text-right" : ""}`}>
                      <div className={`flex items-center gap-2 ${message.speaker === "Moderator" ? "justify-end" : ""}`}>
                        <span className="font-medium">{message.speaker}</span>
                        <span className="text-xs text-gray-500">{message.time}</span>
                      </div>
                      <div className={`mt-1 inline-block rounded-lg px-4 py-2 ${
                        message.speaker === "Moderator" 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted"
                      }`}>
                        <p className="text-sm">{message.text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Type your message..."
                  className="flex-1 px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button>Send</Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Tabs */}
        <div className="col-span-3 overflow-auto">
          <Card className="h-full">
            <CardContent className="p-4">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                <TabsList className="mb-4 grid w-full grid-cols-3">
                  <TabsTrigger value="transcript">Transcript</TabsTrigger>
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="themes">Themes</TabsTrigger>
                </TabsList>

                <TabsContent value="transcript" className="flex-1 overflow-auto">
                  <div className="space-y-4">
                    {discussion.map((message, i) => (
                      <div key={i} className="border-b pb-2">
                        <div className="flex justify-between">
                          <span className="font-medium">{message.speaker}</span>
                          <span className="text-xs text-gray-500">{message.time}</span>
                        </div>
                        <p className="text-sm text-gray-700">{message.text}</p>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="summary" className="flex-1 overflow-auto">
                  <h3 className="font-medium mb-3">Key Insights</h3>
                  <ul className="space-y-2">
                    {insights.map((insight, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-xs">
                          {i + 1}
                        </span>
                        <span className="text-sm">{insight}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Download className="h-4 w-4" />
                      Download Report
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="themes" className="flex-1 overflow-auto">
                  <h3 className="font-medium mb-3">Emerging Themes</h3>
                  <div className="flex flex-wrap gap-2">
                    {themes.map((theme, i) => (
                      <div key={i} className="rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                        {theme}
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
