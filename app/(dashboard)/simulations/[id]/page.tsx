"use client"
import { useParams } from "next/navigation";
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, UserCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { prepareInitialPrompt, prepareSummaryPrompt } from "@/utils/preparePrompt";
import { buildMessagesForOpenAI } from "@/utils/buildMessagesForOpenAI";
import { SimulationMessage } from "@/utils/types";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
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

// Interface for simulation messages


// Interface for formatted message for display
interface FormattedMessage {
  speaker: string;
  text: string;
  time: string;
  sender_id?: string | null;
  sender_type?: string;
}

export default function SimulationViewPage() {
  const params = useParams(); // Use useParams() to get the business_id
  const simulationId = params.simulation_id as string;

  const [activeTab, setActiveTab] = useState("summary")
  const [isLeftPanelMinimized, setIsLeftPanelMinimized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [simulationData, setSimulationData] = useState<SimulationResponse | null>(null)
  const [messages, setMessages] = useState<Array<{name: string, message: string}>>([])
  const [simulationMessages, setSimulationMessages] = useState<SimulationMessage[]>([])
  const [formattedMessages, setFormattedMessages] = useState<FormattedMessage[]>([])
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isLoadingSummaries, setIsLoadingSummaries] = useState(false)
  const [newMessage, setNewMessage] = useState("")
  const [isEndingDiscussion, setIsEndingDiscussion] = useState(false)
  const [isStartingDiscussion, setIsStartingDiscussion] = useState(false)
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
        console.log('data111', data);
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
  useEffect(() => {
    if (simulationData?.simulation?.id) {
      fetchSimulationMessages(simulationData.simulation.id);
    }
  }, [simulationData]);

  // Function to fetch simulation messages
  const fetchSimulationMessages = async (simId: string) => {
    try {
      setIsLoadingMessages(true);
      const response = await fetch(`/api/simulation-messages/${simId}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching messages: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        console.error("API error:", data.error);
      } else if (data.messages.length === 0) { // in case of human moderator, we need to set the initial message
         // if no messages, set the initial message, later also add condition simulationData.simulation.mode === "human-mod"
        setInitialMessage();
      } else {
        // if there are messages, check how many times moderator has spoken and then set the new message to the next question
        const moderatorMessages = data.messages.filter((msg: SimulationMessage) => msg.sender_type === 'moderator');
        if(moderatorMessages.length) {
          setNewMessage(simulationData?.simulation?.discussion_questions[moderatorMessages.length] || "");
        }
      }
      
      // Store the raw messages
      setSimulationMessages(data.messages || []);
      
      // Create a map of persona IDs to names
      const personaIdToNameMap = (data.personas || []).reduce((map: Record<string, string>, persona: { id: string, name: string }) => {
        map[persona.id] = persona.name;
        return map;
      }, {});
      
      // Format messages for display
      const formatted = (data.messages || []).map((msg: SimulationMessage) => {
        let speakerName = "Unknown";
        
        if (msg.sender_type === 'moderator') {
          speakerName = 'Moderator';
        } else if (msg.sender_id && personaIdToNameMap[msg.sender_id]) {
          speakerName = personaIdToNameMap[msg.sender_id];
        }
        
        // Format timestamp (if available)
        const timestamp = msg.created_at 
          ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : `${msg.turn_number}`;
        
        return {
          speaker: speakerName,
          text: msg.message,
          time: timestamp,
          sender_id: msg.sender_id,
          sender_type: msg.sender_type
        };
      });
      
      setFormattedMessages(formatted);
      
      // return formatted;
      return data.messages
    } catch (err: any) {
      console.error("Error fetching simulation messages:", err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

   // Function to fetch simulation messages
   const fetchSummaries = async (simId: string) => {
    try {
      setIsLoadingSummaries(true);
      const response = await fetch(`/api/simulation-summaries/${simId}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching summaries: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        console.error("API error:", data.error);
      } else {
        // if there are messages, check how many times moderator has spoken and then set the new message to the next question
        console.log('summaries loaded', data);
      }
      return data.messages
    } catch (err: any) {
      console.error("Error fetching simulation messages:", err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const runSimulation = async (customPrompt?: ChatCompletionMessageParam[]) => {
    console.log('runSimulationCalled', simulationData);
    if(simulationData?.simulation && simulationData?.personas) {
      const prompt = customPrompt 
      ? customPrompt 
      : prepareInitialPrompt(simulationData?.simulation, simulationData?.personas);
      console.log('prompt123', prompt, nameToPersonaIdMap);
    
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
          
          // Save the messages to the database
          const saveResult = await saveMessagesToDatabase(parsedMessages);
          
          // // Fetch updated messages after saving
          if (saveResult && simulationData.simulation.id) {
            await fetchSimulationMessages(simulationData.simulation.id);
          }
        }
      } catch (error) {
        console.error("Error running simulation:", error);
      }
    }
  }

  const sendMessage = async () => {
    // this should 1st save the message to the database
    // then fetch the messages from the database
    // then build the messages for openai
    // then send the messages to openai
    // then save the response to the database
    // then fetch the updated messages from the database
    // then update the messages state
    // then update the formatted messages state
   
    //1. save the moderator message to the database
    const modMessage = {
      name: 'Moderator',
      message: newMessage
    }
    const saveResult = await saveMessagesToDatabase([modMessage]);
    if (saveResult && simulationData?.simulation?.id) {
      //2. fetch the messages from the database
      const messageFetched = await fetchSimulationMessages(simulationData.simulation.id);
      setNewMessage('');
     
      if(messageFetched) {
         //3. build the messages for openai
        const sample = {
          messages: messageFetched,
          personas: simulationData?.personas || []
        }
        const prompt = buildMessagesForOpenAI(sample);
        console.log('prompt123',prompt,simulationMessages,formattedMessages, messageFetched, prompt);
        
        //4. send the messages to openai
        runSimulation(prompt);
        // rest of the steps handled in run simulation
      }
    }
    
  }

  // function to set initial message in case of human moderator
  const setInitialMessage = () => {
    const initialMessage = {
      name: 'Moderator',
      message: "Welcome, everyone! Today, we're going to discuss "  + simulationData?.simulation?.topic + ". Let's start with our first question: " + simulationData?.simulation?.discussion_questions[0]
    }
    setNewMessage(initialMessage.message);
  }

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
      setMessages(parsed);
      return parsed;
    } catch (error) {
      console.error("Error parsing simulation response:", error);
      return [];
    }
  };

  // Function to save messages to the database
  const saveMessagesToDatabase = async (parsedMessages: Array<{name: string, message: string}>) => {
    if (!simulationData?.simulation?.id) {
      console.error("Simulation ID is not available");
      return;
    }

    const simulationId = simulationData.simulation.id;
    
    // Map each message to the database structure
    const messageEntries = parsedMessages.map((msg, index) => {
      const isModerator = msg.name.toLowerCase() === 'moderator';
      // Try to find persona ID using the full name first, then fallback to first name
      let senderId = null;
      console.log('msg.name',index, isModerator, msg, msg.name, nameToPersonaIdMap);
      if (!isModerator) {
        // Check full name first
        if (nameToPersonaIdMap[msg.name]) {
          senderId = nameToPersonaIdMap[msg.name];
        } else {
          // Fallback to first name
          const firstName = msg.name.split(' ')[0];
          senderId = nameToPersonaIdMap[firstName];
        }
      }
      
      return {
        simulation_id: simulationId,
        sender_type: isModerator ? 'moderator' : 'participant',
        sender_id: senderId,
        message: msg.message,
        turn_number: index + 1 + simulationMessages?.length // 1-indexed as specified
      };
    });
    
    try {
      // Call API endpoint to save messages to database
      const response = await fetch('/api/simulation-messages/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: messageEntries }),
      });
      
      if (!response.ok) {
        throw new Error(`Error saving messages: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Messages saved successfully:', data);
      return data;
    } catch (error) {
      console.error("Error saving messages to database:", error);
      return null;
    }
  };


  // Function to save summary and themes to the database
  const saveSummaryToDatabase = async (parsedMessages: {summary: string[], themes: string[]}) => {
    if (!simulationData?.simulation?.id) {
      console.error("Simulation ID is not available");
      return;
    }

    const simulationId = simulationData.simulation.id;
    
    try {
      const response = await fetch('/api/simulation-summaries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            simulation_id: simulationId,
            summary: parsedMessages.summary,
            themes: parsedMessages.themes
          }
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Error saving messages: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Summary and themes saved successfully:', data);
      return data;
    } catch (error) {
      console.error("Error saving summary to database:", error);
      return null;
    }
  };

  const startDiscussion = async () => {
    setIsStartingDiscussion(true);
    runSimulation();

  }

  const endDiscussion = async () => {
    // setIsEndingDiscussion(true);
    // try {
    //   // Send a final thank you message from the moderator
    //   const finalMessage = {
    //     name: 'Moderator',
    //     message: "Thank you all for your valuable participation and insights in today's discussion. Your feedback has been incredibly helpful. This concludes our session."
    //   };
      
    //   // Save the final message
    //   const saveResult = await saveMessagesToDatabase([finalMessage]);
      
    //   if (saveResult && simulationData?.simulation?.id) {
    //     // Update the simulation status to completed
    //     const response = await fetch(`/api/simulations/${simulationData.simulation.id}`, {
    //       method: 'PATCH',
    //       headers: {
    //         'Content-Type': 'application/json',
    //       },
    //       body: JSON.stringify({
    //         status: 'Completed'
    //       }),
    //     });

    //     if (!response.ok) {
    //       throw new Error('Failed to update simulation status');
    //     }

    //     // Fetch the final messages to update the UI
    //     await fetchSimulationMessages(simulationData.simulation.id);
        
    //     // Update local simulation data
    //     setSimulationData(prev => prev ? {
    //       ...prev,
    //       simulation: {
    //         ...prev.simulation,
    //         status: 'Completed'
    //       }
    //     } : null);
    //   }

    

    // } catch (error) {
    //   console.error('Error ending discussion:', error);
    // } finally {
    //   setIsEndingDiscussion(false);
    // }

    if(simulationData?.simulation && simulationMessages) {
    
      const prompt = prepareSummaryPrompt(simulationData?.simulation, simulationMessages);
      console.log('prompt12345',simulationMessages,simulationData?.simulation, prompt, nameToPersonaIdMap);
    
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
          console.log('Parsed messages222:', parsedMessages);
          
          // Save the summary and themes to the database
          const saveResult = await saveSummaryToDatabase(parsedMessages);
          
          // Fetch summary and themes messages after saving
          if (saveResult && simulationData.simulation.id) {
            await fetchSummaries(simulationData.simulation.id);
          }
        }
      } catch (error) {
        console.error("Error running simulation:", error);
      }
    }
  };

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

  // Create a map of first names to persona IDs for easy lookup
  const nameToPersonaIdMap = personas.reduce((map, persona) => {
    // Extract first name (assuming format is "First Last")
    const firstName = persona.name.split(' ')[0];
    // Add both first name and full name as keys
    map[firstName] = persona.id;
    map[persona.name] = persona.id;
    return map;
  }, {} as Record<string, string>);
  
  // console.log('Name to Persona ID Map:', nameToPersonaIdMap);

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
            <span>{simulation.mode === 'ai-both' ? 'AI ' + (simulation.study_type === 'focus-group'? 'Moderator': 'Interviewer') + ' + AI ' + (simulation.study_type === 'focus-group'? 'Participants': 'Participant') : 'Human ' + (simulation.study_type === 'focus-group'? 'Moderator': 'Interviewer') + ' + AI ' + (simulation.study_type === 'focus-group'? 'Participants': 'Participant')}</span>
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
              <h2 className="font-semibold mb-4"> {simulation.study_type === 'focus-group'? 'Participants': 'Participant'} {simulation.study_type === 'focus-group'?'(' + personas.length + ')': ''}</h2>
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
                {formattedMessages.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    {isLoadingMessages ? "Loading discussion..." : "No messages yet. Start the simulation to begin the discussion."}
                  </div>
                ) : (
                  formattedMessages.map((message, i) => (
                    <div key={i} className={`flex gap-4 ${message.speaker === "Moderator" ? "flex-row-reverse" : ""}`}>
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        {message.speaker === "Moderator" ? "M" : message.speaker[0]}
                      </div>
                      <div className={`flex-1 ${message.speaker === "Moderator" ? "text-right" : ""}`}>
                        <div className={`flex items-center gap-2 ${message.speaker === "Moderator" ? "justify-end" : ""}`}>
                          <span className="font-medium"> { message.speaker === "Moderator" ? 
                           (simulationData?.simulation?.study_type === 'focus-group'? 'Moderator': 'Interviewer') : message.speaker}
                            {/* {message.speaker} */}
                            </span>
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
                  ))
                )}
              </div>
            </CardContent>
            <div className="p-2 border-t">
            { (simulationData?.simulation?.mode === "human-mod") &&<div className="flex gap-2 ">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={simulation.status === 'Completed'}
                />
                <Button 
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || simulation.status === 'Completed' || isLoadingMessages}
                >
                  Send
                </Button>
                
              </div>}

              { (formattedMessages.length > 0) &&<div className="mt-2">
                
                <Button 
                  variant="destructive"
                  onClick={endDiscussion}
                  // disabled={simulation.status === 'Completed' || isEndingDiscussion}
                >
                  {isEndingDiscussion ? "Ending..." : "Thank participants and End Discussion"}
                </Button>
              </div>}

             { (simulationData?.simulation?.mode === "ai-both" && formattedMessages.length === 0) &&<div className="mt-2">
                <Button 
                  onClick={startDiscussion}
                  disabled={isStartingDiscussion}
                >
                  {isStartingDiscussion ? "Starting..." : "Start Discussion"}
                </Button>
              </div>}

            </div>
          </Card>
        </div>

        {/* Right Column - Tabs */}
        <div className="col-span-3 overflow-auto">
          <Card className="h-full">
            <CardContent className="p-4">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                <TabsList className="mb-4 grid w-full grid-cols-2">
                  {/* <TabsTrigger value="transcript">Transcript</TabsTrigger> */}
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="themes">Themes</TabsTrigger>
                </TabsList>

                {/* <TabsContent value="transcript" className="flex-1 overflow-auto">
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
                </TabsContent> */}

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
