"use client"
import { useParams } from "next/navigation";
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, UserCircle, Menu, Copy, ChevronDown, ChevronUp } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { prepareInitialPrompt, prepareSummaryPrompt } from "@/utils/preparePrompt";
import { buildMessagesForOpenAI, buildFollowUpQuestionsPrompt } from "@/utils/buildMessagesForOpenAI";
import { SimulationMessage } from "@/utils/types";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import Link from "next/link";
import { Persona,Simulation } from "@/utils/types";
import { logErrorNonBlocking } from "@/utils/errorLogger";
import { MediaViewer } from "@/components/media-viewer";
import { MediaSlideshow } from "@/components/media-slideshow";
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { RAGUpload } from "@/components/rag-upload"
import { CREDIT_RATES } from '@/utils/openai'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ModelSelectorWithCredits } from '@/components/ModelSelectorWithCredits';
import { useCredits } from "@/hooks/useCredits"; // adjust path as needed
import { runSimulationAPI } from '@/utils/api';

// Interface for the Simulation data


// Interface for the API response
interface SimulationResponse {
  simulation: Simulation;
  personas: Persona[];
  error?: string;
}

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
  const simulationId = params.id as string;

  const [activeTab, setActiveTab] = useState("summary")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showErrorPopup, setShowErrorPopup] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [isSimulationRunning, setIsSimulationRunning] = useState(false)
  const [simulationData, setSimulationData] = useState<SimulationResponse | null>(null)
  const [messages, setMessages] = useState<Array<{name: string, message: string}>>([])
  const [simulationMessages, setSimulationMessages] = useState<SimulationMessage[]>([])
  const [formattedMessages, setFormattedMessages] = useState<FormattedMessage[]>([])
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isLoadingSummaries, setIsLoadingSummaries] = useState(false)
  const [newMessage, setNewMessage] = useState("")
  const [isEndingDiscussion, setIsEndingDiscussion] = useState(false)
  const [isStartingDiscussion, setIsStartingDiscussion] = useState(false)
  const [simulationSummaries, setSimulationSummaries] = useState<{summaries: any[], themes: any[]} | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [modelInUse, setModelInUse] = useState<string>('gpt-4o-mini')
  const [showInstructionBox, setShowInstructionBox] = useState(false)
  const [userInstruction, setUserInstruction] = useState("")
  const [showFollowUpQuestions, setShowFollowUpQuestions] = useState(false)
  const [isLoadingFollowUpQuestions, setIsLoadingFollowUpQuestions] = useState(false)
  const [followUpQuestions, setFollowUpQuestions] = useState<{question: string}[]>([])
  const [isParticipantsCollapsed, setIsParticipantsCollapsed] = useState(false)
  const [isDiscussionQuestionsCollapsed, setIsDiscussionQuestionsCollapsed] = useState(false)
  const [askedQuestionIndices, setAskedQuestionIndices] = useState<number[]>([])
  // const { availableCredits, setAvailableCredits, fetchUserCredits } = useCredits();

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

  // Ref for the textarea to enable scrolling and focusing
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Function to handle discussion question selection
  const handleQuestionSelect = (question: string, questionIndex?: number) => {
    setNewMessage(question);
    
    // Mark question as asked if index is provided
    if (questionIndex !== undefined && !askedQuestionIndices.includes(questionIndex)) {
      setAskedQuestionIndices(prev => [...prev, questionIndex]);
    }
    
    // Scroll to and focus the textarea after a brief delay to ensure the text is set
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        textareaRef.current.focus();
      }
    }, 100);
  };

  // Function to handle "Ask next question" functionality
  const handleNextQuestion = () => {
    if (!simulation.discussion_questions) return;
    
    // Find the next unasked question
    const nextQuestionIndex = simulation.discussion_questions.findIndex((_, index) => 
      !askedQuestionIndices.includes(index)
    );
    
    if (nextQuestionIndex !== -1) {
      const nextQuestion = simulation.discussion_questions[nextQuestionIndex];
      handleQuestionSelect(nextQuestion, nextQuestionIndex);
    }
  };

  // Function to handle follow-up questions
  const handleFollowUpQuestions = async (messagesOverride?: SimulationMessage[]) => {
    console.log('amit-handleFollowUpQuestions', showFollowUpQuestions)
    if (!showFollowUpQuestions) {
      setShowFollowUpQuestions(true)
      console.log('amit-handleFollowUpQuestions-true', followUpQuestions)
      setIsLoadingFollowUpQuestions(true)
      
      // Get only the most recent message exchange (last moderator question + respondent answers)
      const getRecentMessageExchange = (messages: SimulationMessage[]) => {
        if (!messages || messages.length === 0) return [];
        
        // Find the last moderator message
        let lastModeratorIndex = -1;
        for (let i = messages.length - 1; i >= 0; i--) {
          if (messages[i].sender_type === 'moderator') {
            lastModeratorIndex = i;
            break;
          }
        }
        
        // If no moderator message found, return empty array
        if (lastModeratorIndex === -1) return [];
        
        // Return the last moderator message and all subsequent messages (respondent answers)
        return messages.slice(lastModeratorIndex);
      };
      
      // Use provided messages or fall back to state
      const messagesToUse = messagesOverride || simulationMessages || [];
      console.log('simulationMessages', messagesToUse);
      const recentMessages = getRecentMessageExchange(messagesToUse);
      
      const sample = {
        simulation: simulationData?.simulation || {} as Simulation,
        messages: recentMessages,
        personas: simulationData?.personas || [] as Persona[]
      }
      const prompt = buildFollowUpQuestionsPrompt(sample)
      console.log('prompt-followup', prompt);
      console.log('recent-messages-used', recentMessages);
      const data = await runSimulationAPI(prompt, modelInUse);
      // console.log('data', data);
      const parsedMessages = parseSimulationResponse(data.reply);
      console.log('parsedMessages-amit', parsedMessages);
      setFollowUpQuestions(parsedMessages.questions)
      setIsLoadingFollowUpQuestions(false)
    } else {
      setShowFollowUpQuestions(false)
      setFollowUpQuestions([])
    }
  }

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
    console.log('simulationData111', simulationData);
    if (simulationData?.simulation?.id) {
      fetchSimulationMessages(simulationData.simulation.id);
      if(simulationData?.simulation?.status === "Completed") {
        // Fetch summary and themes messages 
        fetchSimulationSummaries();
      }
      // Set userInstruction from simulation data if available
      if (simulationData.simulation.user_instructions) {
        setUserInstruction(simulationData.simulation.user_instructions);
      }
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
        // sort messages by created_at date
        data.messages.sort((a: SimulationMessage, b: SimulationMessage) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        // if there are messages, check how many times moderator has spoken and then set the new message to the next question
        // const moderatorMessages = data.messages.filter((msg: SimulationMessage) => msg.sender_type === 'moderator');
        // if(moderatorMessages.length) {
        //   setNewMessage(simulationData?.simulation?.discussion_questions?.[moderatorMessages.length] || "");
        // }
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
      
      // return the raw messages for further processing
      return data.messages || []
    } catch (err: any) {
      console.error("Error fetching simulation messages:", err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

   // Function to fetch simulation messages
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
        // if there are messages, check how many times moderator has spoken and then set the new message to the next question
        console.log('summaries loaded', data);
        setSimulationSummaries(data);
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
        setIsSimulationRunning(true);
        const data = await runSimulationAPI(prompt, modelInUse);
        console.log('API response:', data);
        // setAvailableCredits(data.creditInfo.remaining_credits);
        
        if (data.reply) {
          // Parse the response into messages
          const parsedMessages = parseSimulationResponse(data.reply);
          console.log('Parsed messages111:', parsedMessages);
          const extractedParticipantMessages = extractParticipantMessages(parsedMessages);
          // Save the messages to the database
          const saveResult = await saveMessagesToDatabase(extractedParticipantMessages);
          
          // // Fetch updated messages after saving
          if (saveResult && simulationData.simulation.id) {
            const updatedMessages = await fetchSimulationMessages(simulationData.simulation.id);
            // Call handleFollowUpQuestions with the fresh messages
            if (updatedMessages) {
              handleFollowUpQuestions(updatedMessages);
            }
          }
        }
      } catch (error) {
        console.error("Error running simulation:", error);
      } finally {
        setIsSimulationRunning(false);
        // Don't call handleFollowUpQuestions here - it will be called after fetchSimulationMessages
      }
    }
  }

  // Function to extract participant array from any JSON structure
  function extractParticipantMessages(parsedResponse: any) {
    // If it's already an array, return it directly
    if (Array.isArray(parsedResponse)) {
      return parsedResponse;
    }
    
    // Look for any property that contains an array of objects with name/message
    for (const [key, value] of Object.entries(parsedResponse)) {
      if (Array.isArray(value) && value.length > 0) {
        // Check if the first item has name and message properties
        const firstItem = value[0];
        if (firstItem && typeof firstItem === 'object' && 
            ('name' in firstItem || 'Name' in firstItem) && 
            ('message' in firstItem || 'Message' in firstItem)) {
          return value;
        }
      }
    }
    
    // If no valid array found, return empty array
    return [];
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
    setShowFollowUpQuestions(false);
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
          simulation: simulationData?.simulation,
          messages: messageFetched,
          personas: simulationData?.personas || []
        }
        const prompt = buildMessagesForOpenAI(sample, simulationData.simulation.study_type, userInstruction);
        console.log('prompt1111',prompt,simulationMessages,formattedMessages, messageFetched, prompt);
        
          //4. send the messages to openai
        runSimulation(prompt);
        // rest of the steps handled in run simulation
      }
    }
    console.log('amit-handleFollowUpQuestions111', showFollowUpQuestions)
  }

  const sendMessageTest = async () => {
    const message = `Michael Rodriguez: To identify macroeconomic trends, I usually rely on economic reports from government agencies, central banks, and reputable financial institutions. I look at indicators like GDP growth, inflation rates, employment numbers, and interest rates to understand the broader economic environment. Additionally, I pay attention to geopolitical events and global trade dynamics that could impact the sector or market I'm analyzing.;`
    const parsedMessages = testParseSimulationResponse(message);
    console.log('parsedMessages', parsedMessages);
  }

  // function to set initial message in case of human moderator
  const setInitialMessage = () => {
    const initialMessage = {
      name: 'Moderator',
      message: "Welcome, everyone! Today, we're going to discuss "  + simulationData?.simulation?.topic + ". Let's start with our first question: " + simulationData?.simulation?.discussion_questions?.[0]
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
      // --- Fallback single-speaker parser ---
      console.log('error in parsing', error, responseString);
      const match = responseString.trim().match(/^([^:]+):\s*([\s\S]+)$/);
      if (match) {
        const [, name, message] = match;
        const fallbackParsed = [{ name: name.trim(), message: message.trim() }];
        setMessages(fallbackParsed);
        return fallbackParsed;
      }
      
      const fallbackMatch = responseString.trim().match(/^([^:]+):\s*(.+)$/);
      console.log('error in parsing-fallbackMatch', fallbackMatch);
      if (fallbackMatch) {
        console.log('error in parsing-fallbackMatch-if', fallbackMatch);
        const [_, name, message] = fallbackMatch;
        const fallbackParsed = [{ name: name.trim(), message: message.trim() }];
        setMessages(fallbackParsed);
        return fallbackParsed;
      }

      // --- Log final error if both parsing strategies fail ---
      console.error("Error parsing simulation response:", error);
      
      // Log the error to our database
      logErrorNonBlocking(
        'simulation_parser',
        error instanceof Error ? error : String(error),
        responseString,
        { 
          simulation_id: simulationId,
          page: 'simulation_detail'
        },
        params.user_id as string || undefined
      );

      // Show error popup instead of chat message
      setErrorMessage("We are experiencing some difficulties connecting to OpenAI. Please try sending the previous message again in a moment.");
      setShowErrorPopup(true);
      
      return [];
    }
  };

  // Function to parse the simulation response
  const testParseSimulationResponse = (responseString: string) => {
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

      // Show error popup instead of chat message
      setErrorMessage("We are experiencing some difficulties connecting to OpenAI. Please try sending the previous message again in a moment.");
      setShowErrorPopup(true);
      // --- Fallback single-speaker parser ---
      const fallbackMatch = responseString.trim().match(/^([^:]+):\s*(.+)$/);
      console.log('fallbackMatch', fallbackMatch);
      if (fallbackMatch) {
        const [_, name, message] = fallbackMatch;
        const fallbackParsed = [{ name: name.trim(), message: message.trim() }];
        setMessages(fallbackParsed);
        return fallbackParsed;
      }

      // Show user-friendly error message
      setMessages([{
        name: "System",
        message: "We are experiencing some difficulties connecting to OpenAI. Please try sending the previous message again in a moment."
      }]);

      // --- Log final error if both parsing strategies fail ---
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
    setIsEndingDiscussion(true);
    try {
      // Send a final thank you message from the moderator
      const finalMessage = {
        name: 'Moderator',
        message: "Thank you all for your valuable participation and insights in today's discussion. Your feedback has been incredibly helpful. This concludes our session."
      };
      
      // Save the final message
      const saveResult = await saveMessagesToDatabase([finalMessage]);
      
      if (saveResult && simulationData?.simulation?.id) {
        // Update the simulation status to completed
        const response = await fetch(`/api/simulations/${simulationData.simulation.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'Completed'
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update simulation status');
        }

        // Fetch the final messages to update the UI
        await fetchSimulationMessages(simulationData.simulation.id);
        
        // Update local simulation data
        setSimulationData(prev => prev ? {
          ...prev,
          simulation: {
            ...prev.simulation,
            status: 'Completed'
          }
        } : null);
      }

    } catch (error) {
      console.error('Error ending discussion:', error);
    } finally {
      setIsEndingDiscussion(false);
    }

    if(simulationData?.simulation && simulationMessages) {
      const prompt = prepareSummaryPrompt(simulationData?.simulation, simulationMessages);
      console.log('prompt12345',simulationMessages,simulationData?.simulation, prompt, nameToPersonaIdMap);
    
      try {
        const data = await runSimulationAPI(prompt);
        console.log('API response:', data);
        // setAvailableCredits(data.creditInfo.remaining_credits);
        
        if (data.reply) {
          // Parse the response into messages
          const parsedMessages = parseSimulationResponse(data.reply);
          console.log('Parsed messages222:', parsedMessages);
          
          // Save the summary and themes to the database
          const saveResult = await saveSummaryToDatabase(parsedMessages);
          
          // Fetch summary and themes messages after saving
          if (saveResult && simulationData?.simulation?.id) {
            await fetchSimulationSummaries();
          }
        }
      } catch (error) {
        console.error("Error running simulation:", error);
      }
    }
  };

  const copyTranscript = () => {
    if (!formattedMessages.length) return;
    // Build the transcript string
    const transcript = formattedMessages.map(m => `${m.speaker}: ${m.text}`).join("\n");
    navigator.clipboard.writeText(transcript);
  };
  
  // useEffect(() => {
  //     fetchUserCredits();
  // }, [params.user_id]);

  // Save instruction handler (expand as needed)
  const saveInstruction = async () => {
    setShowInstructionBox(false);
    if (!simulationData?.simulation?.id) return;
    try {
      await fetch(`/api/simulations/${simulationData.simulation.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_instructions: userInstruction }),
      });
    } catch (error) {
      console.error('Failed to save user instruction:', error);
    }
    // You can add logic here to use userInstruction in your LLM prompt
  }

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
    <div className="min-h-screen bg-background">
      {/* Error Popup */}
      {showErrorPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Connection Error</h3>
            <p className="text-gray-600 mb-4">{errorMessage}</p>
            <div className="flex justify-end">
              <Button onClick={() => setShowErrorPopup(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto p-4 space-y-4">
      {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/simulations">
          <ArrowLeft className="h-4 w-4" />
              </Link>
        </Button>
        <div>
              <h1 className="text-2xl font-bold">{simulation.topic}</h1>
              {simulation.stimulus_media_url && (
                <div className="mt-4 mb-4">
                  {Array.isArray(simulation.stimulus_media_url) ? (
                    simulation.stimulus_media_url.length > 0 ? (
                      <MediaSlideshow 
                        urls={simulation.stimulus_media_url} 
                        triggerLabel="View Stimulus"
                      />
                    ) : (
                      <p className="text-sm text-gray-500">No media attached to this simulation</p>
                    )
                  ) : (
                    // Backward compatibility - handle single URL string
                    <MediaSlideshow 
                      urls={[simulation.stimulus_media_url as string]} 
                      triggerLabel="View Stimulus" 
                    />
                  )}
                </div>
              )}
          <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>{new Date(simulation.created_at).toLocaleDateString()}</span>
            <span>•</span>
                <span>{simulation.mode === 'ai-both' ? 'AI ' + (simulation.study_type === 'focus-group'? 'Moderator': 'Interviewer') + ' + AI ' + (simulation.study_type === 'focus-group'? 'Participants': 'Participant') : 'Human ' + (simulation.study_type === 'focus-group'? 'Moderator': 'Interviewer') + ' + AI ' + (simulation.study_type === 'focus-group'? 'Participants': 'Participant')}</span>
            <Badge variant={simulation.status === "Completed" ? "default" : "secondary"}>{simulation.status}</Badge>
              </div>
          </div>
        </div>
      </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Participants Section - Full width on mobile, side column on desktop */}
          <div className="col-span-1 lg:col-span-3 space-y-4">
            {/* Participants Section */}
            <Card className="h-fit">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold">
                    {simulation.study_type === 'focus-group'? 'Participants': 'Participant'} {simulation.study_type === 'focus-group'?'(' + personas.length + ')': ''}
                  </h2>
                  <button
                    onClick={() => setIsParticipantsCollapsed(!isParticipantsCollapsed)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    title={isParticipantsCollapsed ? "Expand participants" : "Collapse participants"}
                  >
                    {isParticipantsCollapsed ? (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronUp className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                </div>
                
                {!isParticipantsCollapsed && (
                  <>
                    {personas.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        No participants added to this simulation
                      </div>
                    ) : (
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
                  </>
                )}
              </CardContent>
            </Card>

            {/* Discussion Questions Section */}
            <Card className="h-fit">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold">Discussion Questions</h2>
                  <button
                    onClick={() => setIsDiscussionQuestionsCollapsed(!isDiscussionQuestionsCollapsed)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    title={isDiscussionQuestionsCollapsed ? "Expand questions" : "Collapse questions"}
                  >
                    {isDiscussionQuestionsCollapsed ? (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronUp className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                </div>
                
                {!isDiscussionQuestionsCollapsed && (
                  <>
                    {!simulation.discussion_questions || simulation.discussion_questions.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        No discussion questions added to this simulation
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {simulation.discussion_questions.map((question, index) => {
                          const isAsked = askedQuestionIndices.includes(index);
                          return (
                            <div 
                              key={index} 
                              className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors border ${
                                isAsked 
                                  ? 'bg-green-50 border-green-200 opacity-75' 
                                  : 'bg-gray-50 hover:bg-gray-100 border-transparent hover:border-primary/20'
                              }`}
                              onClick={() => handleQuestionSelect(question, index)}
                              title={isAsked ? "This question has been asked" : "Click to add this question to your message"}
                            >
                              <div className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                                isAsked 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-primary/10 text-primary'
                              }`}>
                                {isAsked ? '✓' : index + 1}
                              </div>
                              <p className={`text-sm leading-relaxed ${
                                isAsked ? 'text-gray-500 line-through' : 'text-gray-700'
                              }`}>
                                {question}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Chat Window - Full width on mobile */}
          <div className={`col-span-1 ${
            simulationData?.simulation?.status === 'Completed' && simulationSummaries ? 
            'lg:col-span-6' : 'lg:col-span-9'
          }`}>
            <Card className="h-full flex flex-col">
              <CardContent className="p-4 flex-1 overflow-auto">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                Discussion
                {/* {simulationData?.simulation?.status === 'Completed' && ( */}
                  <button
                    className="ml-2 p-1 rounded hover:bg-gray-100"
                    title="Copy transcript"
                    onClick={copyTranscript}
                  >
                    <Copy className="h-4 w-4 text-primary" />
                  </button>
                {/* )} */}
              </h2>
              <div className="space-y-6">
                  {formattedMessages.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      {isLoadingMessages ? "Loading discussion..." : "No messages yet. Start the simulation to begin the discussion."}
                    </div>
                  ) : (
                    <>
                      {formattedMessages.map((message, i) => {
                        const isModeratorMessage = message.speaker === "Moderator";
                        const personaColor = !isModeratorMessage && message.sender_id 
                          ? getPersonaColor(message.sender_id, personas) 
                          : '#9238FF'; // Purple color to match moderator message bubble
                        
                        return (
                          <div key={i} className={`flex gap-4 items-end ${isModeratorMessage ? "flex-row-reverse" : ""}`}>
                            <div 
                              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-white font-medium"
                              style={{ backgroundColor: personaColor }}
                            >
                              {isModeratorMessage ? "M" : message.speaker[0]}
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
                                      {simulationData?.simulation?.study_type === 'focus-group'? 'Moderator': 'Interviewer'}
                                    </span>
                                  </div>
                                )}
                                <p className="text-sm">{message.text}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {isSimulationRunning && (
                        <div className="flex gap-4">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                            AI
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">AI Assistant</span>
                            </div>
                            <div className="mt-1 inline-block rounded-lg px-4 py-2 bg-muted">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 bg-primary rounded-full animate-bounce" />
                                <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                                <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
              <div className="p-2 border-t">

              { (simulationData?.simulation?.mode === "ai-both" && formattedMessages.length === 0) &&<div className="mt-2">
                  <Button 
                    onClick={startDiscussion}
                    disabled={isStartingDiscussion}
                  >
                    {isStartingDiscussion ? "Starting..." : "Start Discussion"}
                  </Button>
                </div>}

                 {/* AI Instruction Box */}
                 {formattedMessages.length > 0 && (
                //  { (simulationData?.simulation?.mode === "human-mod") && (
                  <div className="mt-2 space-y-2">
                    <button
                      type="button"
                      className="text-xs text-primary underline hover:text-primary/80 focus:outline-none"
                      onClick={() => setShowInstructionBox(v => !v)}
                    >
                      {showInstructionBox ? "Hide AI instruction box" : "Not happy with the response? Instruct AI to improve its replies."}
                    </button>
                    
                    {/* Ask Next Question Button */}
                    {simulation.discussion_questions && simulation.discussion_questions.length > 0 && (
                      <button
                        type="button"
                        className="block text-xs text-primary underline hover:text-primary/80 focus:outline-none mb-1"
                        onClick={handleNextQuestion}
                        disabled={askedQuestionIndices.length >= simulation.discussion_questions.length}
                      >
                        {askedQuestionIndices.length >= simulation.discussion_questions.length 
                          ? "All questions asked" 
                          : `Ask next question (${askedQuestionIndices.length + 1} of ${simulation.discussion_questions.length})`
                        }
                      </button>
                    )}
                    
                    <button
                      type="button"
                      className="block text-xs text-primary underline hover:text-primary/80 focus:outline-none"
                      onClick={handleFollowUpQuestions}
                    >
                      {showFollowUpQuestions ? "Hide follow-up questions" : "Suggest follow-up questions"}
                    </button>
                    
                    {showInstructionBox && (
                      <div className="mt-2 flex flex-col gap-2">
                        <textarea
                          className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          rows={2}
                          placeholder="E.g. Be more concise, use simpler language, ask more follow-up questions..."
                          value={userInstruction}
                          onChange={e => setUserInstruction(e.target.value)}
                        />
                        <div className="flex justify-end">
                          <Button size="sm" variant="secondary" onClick={saveInstruction}>
                            Save Instruction
                          </Button>
                        </div>
                      </div>
                    )}

                    {showFollowUpQuestions && (
                      <div className="mt-2 flex flex-col gap-2">
                        {isLoadingFollowUpQuestions ? (
                          <div className="flex items-center gap-2 py-2">
                            <div className="h-2 w-2 bg-primary rounded-full animate-bounce" />
                            <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                            <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                            <span className="text-xs text-gray-500 ml-2">Generating follow-up questions...</span>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-xs text-gray-500">Click on a question to add it to your message:</p>
                            {followUpQuestions.map((questionObj, index) => (
                              <button
                                key={index}
                                type="button"
                                className="w-full text-left p-2 text-xs border border-gray-200 rounded hover:bg-gray-50 hover:border-primary transition-colors"
                                onClick={() => handleQuestionSelect(questionObj.question)}
                              >
                                {questionObj.question}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

               

                {((simulationData?.simulation?.mode === "human-mod") || (formattedMessages.length > 0)) &&
                <div className="mt-2 space-y-2">
                  {/* Full width multiline textbox */}
                  <textarea 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    rows={3}
                    disabled={simulation.status === 'Completed'}
                    ref={textareaRef}
                  />
                  
                  {/* Model selector and Send button row */}
                  {/* {availableCredits !== null && ( */}
                    <div className="flex gap-2 items-center">
                      <div className="flex-1">
                        <Select
                          value={modelInUse}
                          onValueChange={(value: string) => setModelInUse(value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select model" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(CREDIT_RATES).map(([model, rates]) => (
                              <SelectItem key={model} value={model}>
                                {model} 
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button 
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || simulation.status === 'Completed' || isLoadingMessages}
                      >
                        Send
                      </Button>
                    </div>
                  {/* )} */}
                  
                  
                  {/* RAG Upload - positioned above End Discussion button */}
                  {formattedMessages.length > 0 && simulation.status !== 'Completed' && (
                    <div className="mb-4">
                      <RAGUpload 
                        simulationId={simulation.id} 
                        disabled={isEndingDiscussion}
                      />
                    </div>
                  )}
                  
                  {/* End discussion button */}
                  {formattedMessages.length > 0 && (
                    <Button
                      className="w-full"
                      variant="destructive"
                      onClick={endDiscussion}
                      disabled={simulation.status === 'Completed' || isEndingDiscussion}
                    >
                      {isEndingDiscussion ? "Ending..." : "End Discussion and generate insights"}
                    </Button>
                  )}
                </div>}


                
              </div>
          </Card>
        </div>

          {/* Summary Tabs - Only show when discussion is completed and summary is available */}
          {simulationData?.simulation?.status === 'Completed' && simulationSummaries && (
            <div className="col-span-1 lg:col-span-3">
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
                          {simulationSummaries?.summaries.map((insight, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-xs">
                              {i + 1}
                            </span>
                              <span className="text-sm">{insight.summary}</span>
                          </li>
                        ))}
                      </ul>

                        {/* <div className="mt-6">
                        <Button variant="outline" size="sm" className="gap-2">
                          <Download className="h-4 w-4" />
                          Download Report
                          </Button> uncomment me Amit
                        </div> */}
                    </TabsContent>

                    <TabsContent value="themes" className="flex-1 overflow-auto">
                      <h3 className="font-medium mb-3">Emerging Themes</h3>
                      <div className="flex flex-wrap gap-2">
                          {simulationSummaries?.themes.map((theme, i) => (
                          <div key={i} className="rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                              {theme.theme}
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
