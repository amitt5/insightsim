"use client"
import { useParams } from "next/navigation";
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download } from "lucide-react"
import Link from "next/link";
import { Persona, Simulation } from "@/utils/types";

// Interface for the Simulation data
interface SimulationResponse {
  simulation: Simulation;
  personas: Persona[];
  error?: string;
}

export default function SimulationInsightsPage() {
  const params = useParams();
  const simulationId = params.id as string;

  const [activeTab, setActiveTab] = useState("summary")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [simulationData, setSimulationData] = useState<SimulationResponse | null>(null)
  const [simulationSummaries, setSimulationSummaries] = useState<{summaries: any[], themes: any[]} | null>(null)
  const [isLoadingSummaries, setIsLoadingSummaries] = useState(false)

  // Color palette for personas (10 colors)
  const personaColors = [
    '#E91E63', // Pink
    '#673AB7', // Deep Purple
    '#3F51B5', // Indigo
    '#2196F3', // Blue
    '#00BCD4', // Cyan
    '#009688', // Teal
    '#4CAF50', // Green
    '#FF9800', // Orange
    '#F44336', // Red
    '#795548', // Brown
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

  // Fetch simulation summaries when simulation data is loaded
  useEffect(() => {
    if (simulationData?.simulation?.id && simulationData?.simulation?.status === "Completed") {
      fetchSimulationSummaries();
    }
  }, [simulationData]);

  // Function to fetch simulation summaries
  const fetchSimulationSummaries = async () => {
    try {
      setIsLoadingSummaries(true);
      const response = await fetch(`/api/simulation-summaries/${simulationData?.simulation.id}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching summaries: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        console.error("API error:", data.error);
      } else {
        console.log('summaries loaded', data);
        setSimulationSummaries(data);
      }
    } catch (err: any) {
      console.error("Error fetching simulation summaries:", err);
    } finally {
      setIsLoadingSummaries(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-[70vh]">Loading simulation insights...</div>;
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

  if (simulation.status !== 'Completed') {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
        <div className="text-xl font-semibold">Simulation not completed</div>
        <div className="text-gray-500">Please complete the simulation first to view insights.</div>
        <Button asChild>
          <Link href={`/simulations/${simulationId}`}>Back to Discussion</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/simulations/${simulationId}`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Simulation Insights</h1>
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                <span>{simulation.topic}</span>
                <span>•</span>
                <span>{new Date(simulation.created_at).toLocaleDateString()}</span>
                <Badge variant="default">{simulation.status}</Badge>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/simulations/${simulationId}`}>
                View Discussion
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Download Report
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoadingSummaries && (
          <div className="flex items-center justify-center h-[50vh]">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-primary rounded-full animate-bounce" />
              <div className="h-4 w-4 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="h-4 w-4 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
              <span className="ml-2">Loading insights...</span>
            </div>
          </div>
        )}

        {/* Insights Content */}
        {!isLoadingSummaries && simulationSummaries && (
          <div className="max-w-6xl mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-6 grid w-full grid-cols-5">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="themes">Themes</TabsTrigger>
                <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                <TabsTrigger value="personas">Personas</TabsTrigger>
                <TabsTrigger value="actions">Actions</TabsTrigger>
              </TabsList>

              <TabsContent value="summary">
                <Card>
                  <CardHeader>
                    <CardTitle>Key Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      {simulationSummaries?.summaries.map((insight, i) => (
                        <div key={i} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                            {i + 1}
                          </span>
                          <div className="flex-1">
                            <p className="text-sm leading-relaxed">{insight.summary}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="themes">
                <Card>
                  <CardHeader>
                    <CardTitle>Emerging Themes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {simulationSummaries?.themes.map((theme, i) => (
                        <div key={i} className="bg-primary/5 border border-primary/20 rounded-lg p-6 text-center">
                          <div className="text-4xl mb-2">🎯</div>
                          <h3 className="font-semibold text-primary mb-2">{theme.theme}</h3>
                          <p className="text-sm text-gray-600">Identified across multiple participants</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="recommendations">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        🎯 Product Strategy
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4">
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <h4 className="font-medium text-blue-800 mb-2">Mobile Experience Enhancement</h4>
                          <p className="text-sm text-blue-700 mb-3">Focus on user-friendly mobile app features based on participant feedback</p>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="text-blue-700 border-blue-300">High Impact</Badge>
                            <Badge variant="outline" className="text-blue-700 border-blue-300">Quick Win</Badge>
                          </div>
                        </div>
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <h4 className="font-medium text-blue-800 mb-2">Rewards Program Optimization</h4>
                          <p className="text-sm text-blue-700 mb-3">Enhance cashback rewards program to meet user expectations</p>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="text-blue-700 border-blue-300">Revenue Impact</Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        💡 Innovation Opportunities
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4">
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                          <h4 className="font-medium text-green-800 mb-2">Family-Oriented Tools</h4>
                          <p className="text-sm text-green-700 mb-3">Develop family-oriented financial tools based on user needs</p>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="text-green-700 border-green-300">Innovation</Badge>
                            <Badge variant="outline" className="text-green-700 border-green-300">Market Gap</Badge>
                          </div>
                        </div>
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                          <h4 className="font-medium text-green-800 mb-2">Travel Integration</h4>
                          <p className="text-sm text-green-700 mb-3">Create travel-focused credit card features</p>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="text-green-700 border-green-300">Premium Feature</Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        📊 Marketing Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4">
                        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                          <h4 className="font-medium text-purple-800 mb-2">Transparency Messaging</h4>
                          <p className="text-sm text-purple-700 mb-3">Emphasize transparency and user control in messaging</p>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="text-purple-700 border-purple-300">Brand Trust</Badge>
                          </div>
                        </div>
                        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                          <h4 className="font-medium text-purple-800 mb-2">Target Demographics</h4>
                          <p className="text-sm text-purple-700 mb-3">Target tech-savvy users aged 25-40 with mobile-first approach</p>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="text-purple-700 border-purple-300">Targeting</Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="personas">
                <Card>
                  <CardHeader>
                    <CardTitle>Participant Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6">
                      {personas.map((persona, i) => (
                        <div key={persona.id} className="border rounded-lg p-6">
                          <div className="flex items-center gap-4 mb-4">
                            <div 
                              className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-white text-sm font-medium"
                              style={{ backgroundColor: getPersonaColor(persona.id, personas) }}
                            >
                              {persona.name[0]}
                            </div>
                            <div>
                              <h4 className="text-lg font-semibold">{persona.name}</h4>
                              <p className="text-sm text-gray-500">{persona.age} • {persona.occupation}</p>
                              <p className="text-sm text-gray-600 mt-1">{persona.bio}</p>
                            </div>
                          </div>
                          
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-gray-50 rounded-lg p-4">
                              <h5 className="font-medium text-gray-800 mb-2">Key Contributions</h5>
                              <p className="text-sm text-gray-600">
                                Provided valuable insights on mobile banking preferences and emphasized the importance of user-friendly interfaces.
                              </p>
                            </div>
                            
                            <div className="bg-gray-50 rounded-lg p-4">
                              <h5 className="font-medium text-gray-800 mb-2">Behavioral Patterns</h5>
                              <div className="flex flex-wrap gap-2">
                                <span className="text-xs bg-gray-200 text-gray-700 rounded-full px-3 py-1">Tech-savvy</span>
                                <span className="text-xs bg-gray-200 text-gray-700 rounded-full px-3 py-1">Value-conscious</span>
                                <span className="text-xs bg-gray-200 text-gray-700 rounded-full px-3 py-1">Mobile-first</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                            <h5 className="font-medium text-gray-800 mb-2">Engagement Score</h5>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" 
                                  style={{ width: `${Math.random() * 40 + 60}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium">8.5/10</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="actions">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-red-700">🚨 High Priority Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="border-l-4 border-red-400 bg-red-50 p-4 rounded-r-lg">
                          <h4 className="font-medium text-red-800 mb-2">Immediate Mobile UX Audit</h4>
                          <p className="text-sm text-red-700 mb-3">Conduct comprehensive review of current mobile app user experience</p>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Due: Next Week</Badge>
                            <Badge variant="outline" className="text-red-700 border-red-300">UX Team</Badge>
                          </div>
                        </div>
                        
                        <div className="border-l-4 border-red-400 bg-red-50 p-4 rounded-r-lg">
                          <h4 className="font-medium text-red-800 mb-2">Fee Structure Simplification</h4>
                          <p className="text-sm text-red-700 mb-3">Review and simplify fee structure communication to improve transparency</p>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Due: 2 Weeks</Badge>
                            <Badge variant="outline" className="text-red-700 border-red-300">Product Team</Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-yellow-700">⚠️ Medium Priority Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="border-l-4 border-yellow-400 bg-yellow-50 p-4 rounded-r-lg">
                          <h4 className="font-medium text-yellow-800 mb-2">Family Features Development</h4>
                          <p className="text-sm text-yellow-700 mb-3">Develop family-oriented feature roadmap based on user feedback</p>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Due: 1-3 Months</Badge>
                            <Badge variant="outline" className="text-yellow-700 border-yellow-300">Product Team</Badge>
                          </div>
                        </div>
                        
                        <div className="border-l-4 border-yellow-400 bg-yellow-50 p-4 rounded-r-lg">
                          <h4 className="font-medium text-yellow-800 mb-2">Travel Rewards Enhancement</h4>
                          <p className="text-sm text-yellow-700 mb-3">Design travel rewards enhancement plan to capture travel-focused users</p>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Due: 2-3 Months</Badge>
                            <Badge variant="outline" className="text-yellow-700 border-yellow-300">Marketing Team</Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-green-700">📈 Long-term Strategic Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="border-l-4 border-green-400 bg-green-50 p-4 rounded-r-lg">
                          <h4 className="font-medium text-green-800 mb-2">AI-Driven Personalization</h4>
                          <p className="text-sm text-green-700 mb-3">Explore AI-driven personalization features for enhanced user experience</p>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Due: 3+ Months</Badge>
                            <Badge variant="outline" className="text-green-700 border-green-300">Innovation Team</Badge>
                          </div>
                        </div>
                        
                        <div className="border-l-4 border-green-400 bg-green-50 p-4 rounded-r-lg">
                          <h4 className="font-medium text-green-800 mb-2">Market Research Expansion</h4>
                          <p className="text-sm text-green-700 mb-3">Plan comprehensive market research study to validate findings</p>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Due: 6+ Months</Badge>
                            <Badge variant="outline" className="text-green-700 border-green-300">Research Team</Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* No insights available */}
        {!isLoadingSummaries && !simulationSummaries && (
          <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
            <div className="text-xl font-semibold">No insights available</div>
            <div className="text-gray-500">Insights will be generated after the simulation is completed.</div>
            <Button asChild>
              <Link href={`/simulations/${simulationId}`}>Back to Discussion</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
