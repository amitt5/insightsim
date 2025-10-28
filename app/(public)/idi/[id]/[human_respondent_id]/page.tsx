"use client"
import { useParams } from "next/navigation";
import { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useVapi, VapiMessage } from "@/hooks/useVapi"
import { processMessagesBatch } from "@/utils/messageProcessor"
import { Mic, MicOff, Phone, PhoneOff, AlertCircle, Play, Square } from "lucide-react"

interface HumanRespondent {
  id: string;
  name: string;
  age: number;
  gender: string;
  email: string;
  status: 'in_progress' | 'completed';
  project: {
    id: string;
    name: string;
    discussion_questions: string[];
    created_at: string;
  };
}

export default function InterviewPage() {
  const params = useParams();
  const projectId = params.id as string;
  const humanRespondentId = params.human_respondent_id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [respondentData, setRespondentData] = useState<HumanRespondent | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [voiceActivity, setVoiceActivity] = useState({
    isUserSpeaking: false,
    isAiSpeaking: false,
    userLevel: 0,
    aiLevel: 0
  });

  // VAPI hook integration
  const {
    isCallActive,
    transcript: vapiTranscript,
    error: vapiError,
    isLoading: vapiLoading,
    startInterview,
    stopInterview,
    sendMessage: sendVapiMessage,
    clearError: clearVapiError,
    exportMessageAnalysis
  } = useVapi();

  // Calculate voice activity bar heights based on real voice activity
  const getVoiceBarHeights = () => {
    const { isUserSpeaking, isAiSpeaking, userLevel, aiLevel } = voiceActivity;
    
    if (!isUserSpeaking && !isAiSpeaking) {
      // Silent state - all bars low
      return [20, 25, 30, 25, 20];
    }
    
    if (isUserSpeaking && isAiSpeaking) {
      // Both speaking - mixed pattern
      const userIntensity = Math.min(userLevel * 0.8, 1);
      const aiIntensity = Math.min(aiLevel * 0.6, 1);
      return [
        30 + (userIntensity * 40),
        40 + (aiIntensity * 35),
        50 + (Math.max(userIntensity, aiIntensity) * 40),
        40 + (aiIntensity * 35),
        30 + (userIntensity * 40)
      ];
    }
    
    if (isUserSpeaking) {
      // User speaking - higher activity
      const intensity = Math.min(userLevel * 0.9, 1);
      return [
        40 + (intensity * 40),
        50 + (intensity * 35),
        60 + (intensity * 35),
        50 + (intensity * 35),
        40 + (intensity * 40)
      ];
    }
    
    if (isAiSpeaking) {
      // AI speaking - moderate activity
      const intensity = Math.min(aiLevel * 0.7, 1);
      return [
        25 + (intensity * 35),
        35 + (intensity * 30),
        45 + (intensity * 30),
        35 + (intensity * 30),
        25 + (intensity * 35)
      ];
    }
    
    return [20, 25, 30, 25, 20];
  };

  // Combine text messages and VAPI transcript
  const allMessages = useMemo(() => {
    // Only log when there are significant changes
    if (messages.length > 0 || vapiTranscript.length > 0) {
      console.log(`Combining ${messages.length} text messages with ${vapiTranscript.length} VAPI messages`);
    }
    
    // Process database messages to combine consecutive messages from same speaker
    const processedDatabaseMessages = processMessagesBatch(messages);
    console.log(`Processed ${messages.length} database messages into ${processedDatabaseMessages.length} combined messages`);
    
    // Combine processed database messages with VAPI transcript
    const combined = [...processedDatabaseMessages, ...vapiTranscript];
    console.log('combined', combined);
    
    // Sort by created_at timestamp to maintain chronological order
    const sorted = combined.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    return sorted;
  }, [messages, vapiTranscript]);

  // Track voice activity based on VAPI events
  useEffect(() => {
    if (!isCallActive) {
      // Reset voice activity when call is not active
      setVoiceActivity({
        isUserSpeaking: false,
        isAiSpeaking: false,
        userLevel: 0,
        aiLevel: 0
      });
      return;
    }

    // Listen to VAPI transcript events to detect voice activity
    const handleVoiceActivity = () => {
      // Check recent messages to determine who is speaking
      const recentMessages = allMessages.slice(-3); // Last 3 messages
      const now = Date.now();
      const recentThreshold = 3000; // 3 seconds

      let isUserSpeaking = false;
      let isAiSpeaking = false;
      let userLevel = 0;
      let aiLevel = 0;

      recentMessages.forEach(message => {
        const messageTime = new Date(message.created_at).getTime();
        const isRecent = (now - messageTime) < recentThreshold;
        
        if (isRecent && message.metadata?.isVoice) {
          if (message.sender_type === 'respondent') {
            isUserSpeaking = true;
            userLevel = Math.min(0.8 + Math.random() * 0.2, 1); // Simulate voice level
          } else if (message.sender_type === 'moderator') {
            isAiSpeaking = true;
            aiLevel = Math.min(0.6 + Math.random() * 0.3, 1); // Simulate voice level
          }
        }
      });

      setVoiceActivity({
        isUserSpeaking,
        isAiSpeaking,
        userLevel,
        aiLevel
      });
    };

    // Update voice activity when messages change
    handleVoiceActivity();

    // Set up interval to update voice activity
    const interval = setInterval(handleVoiceActivity, 500);

    return () => clearInterval(interval);
  }, [isCallActive, allMessages]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/public/human-conversations?human_respondent_id=${humanRespondentId}&project_id=${projectId}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching messages: ${response.status}`);
      }
      
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  const getAiResponse = async (isFirstMessage: boolean = false) => {
    setIsAiResponding(true);
    try {
      const response = await fetch('/api/public/ai-moderator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: projectId,
          human_respondent_id: humanRespondentId,
          is_first_message: isFirstMessage
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      await fetchMessages(); // Refresh messages to include AI response
    } catch (err) {
      console.error('Error getting AI response:', err);
      setError('Failed to get interviewer response. Please try again.');
    } finally {
      setIsAiResponding(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending || isAiResponding) return;

    // If voice call is active, send via VAPI
    if (isCallActive) {
      try {
        await sendVapiMessage(newMessage.trim());
        setNewMessage('');
        return;
      } catch (err) {
        console.error('Error sending VAPI message:', err);
        setError('Failed to send voice message. Please try again.');
        return;
      }
    }

    // Otherwise, send via text (existing functionality)
    setIsSending(true);
    try {
      const response = await fetch('/api/public/human-conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: projectId,
          human_respondent_id: humanRespondentId,
          message: newMessage.trim()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      setMessages(prev => [...prev, data]);
      setNewMessage('');
      
      // Fetch updated messages after sending
      await fetchMessages();
      
      // Get AI response after sending message
      await getAiResponse();
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // Voice interview control functions
  const handleStartVoiceInterview = async () => {
    try {
      clearVapiError();
      
      // Get respondent name and discussion guide
      const respondentName = respondentData?.name || 'the respondent';
      const discussionGuide = respondentData?.project?.discussion_questions || [];
      
      console.log('Starting voice interview with:', {
        respondentName,
        discussionGuideCount: discussionGuide.length,
        discussionGuide: discussionGuide,
        projectId,
        humanRespondentId
      });
      
      // Validate that we have the necessary data
      if (!respondentData) {
        throw new Error('Respondent data not available');
      }
      
      if (!respondentData.project) {
        throw new Error('Project data not available');
      }
      
      await startInterview(respondentName, discussionGuide, projectId, humanRespondentId);
    } catch (err) {
      console.error('Failed to start voice interview:', err);
      setError('Failed to start voice interview. Please try again.');
    }
  };

  const handleStopVoiceInterview = async () => {
    try {
      await stopInterview();
    } catch (err) {
      console.error('Failed to stop voice interview:', err);
      setError('Failed to stop voice interview. Please try again.');
    }
  };

  // Voice activity simulation (replace with real VAPI voice detection)
  useEffect(() => {
    if (!isCallActive) {
      setVoiceActivity({
        isUserSpeaking: false,
        isAiSpeaking: false,
        userLevel: 0,
        aiLevel: 0
      });
      return;
    }

    // Simulate voice activity based on AI responding state
    const interval = setInterval(() => {
      setVoiceActivity(prev => {
        // Simulate AI speaking when AI is responding
        if (isAiResponding) {
          return {
            ...prev,
            isAiSpeaking: true,
            aiLevel: Math.random() * 0.8 + 0.2, // 0.2 to 1.0
            isUserSpeaking: false,
            userLevel: 0
          };
        }
        
        // Simulate user speaking occasionally
        if (Math.random() < 0.3) {
          return {
            ...prev,
            isUserSpeaking: true,
            userLevel: Math.random() * 0.9 + 0.1, // 0.1 to 1.0
            isAiSpeaking: false,
            aiLevel: 0
          };
        }
        
        // Silent state
        return {
          ...prev,
          isUserSpeaking: false,
          isAiSpeaking: false,
          userLevel: 0,
          aiLevel: 0
        };
      });
    }, 200); // Update every 200ms for smooth animation

    return () => clearInterval(interval);
  }, [isCallActive, isAiResponding]);

  useEffect(() => {
    const fetchRespondentData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/public/human-respondents/${humanRespondentId}`);
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('humandata', data);
        if (data.error) {
          throw new Error(data.error);
        }

        // Verify this respondent belongs to this project
        if (data.project_id !== projectId) {
          throw new Error('Invalid project ID');
        }
        
        setRespondentData(data);
        setError(null);
        
        // After loading respondent data, fetch messages (but don't auto-start interview)
        await fetchMessages();
      } catch (err: any) {
        console.error("Failed to fetch respondent data:", err);
        setError(err.message || "Failed to load interview data");
        setRespondentData(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRespondentData();
  }, [projectId, humanRespondentId]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-[70vh]">Loading interview...</div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
        <div className="text-xl font-semibold text-red-500">Error</div>
        <div className="text-gray-500">{error}</div>
      </div>
    );
  }

  if (!respondentData || !respondentData.project) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
        <div className="text-xl font-semibold">Interview not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Error Display */}
      {(error || vapiError) && (
        <div className="container mx-auto p-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {vapiError || error}
              {vapiError && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearVapiError}
                  className="ml-2"
                >
                  Dismiss
                </Button>
              )}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Pre-interview layout when no messages exist */}
      {allMessages.length === 0 && !isCallActive ? (
        <div className="container mx-auto p-4 h-screen flex gap-4">
          {/* Debug info */}
          {process.env.NODE_ENV === 'development' && (
            <div className="fixed top-4 right-4 bg-yellow-100 p-2 text-xs">
              Debug: messages={allMessages.length}, isCallActive={isCallActive.toString()}
            </div>
          )}
          {/* Left Section - Placeholder */}
          <div className="w-1/3 bg-white border border-gray-200 rounded-lg flex items-center justify-center">
            <div className="text-center space-y-4">
              <p className="text-gray-600 text-lg">
                We'll populate images, videos, and more in this space throughout the interview.
              </p>
              <p className="text-gray-500">
                Stay tuned.
              </p>
            </div>
          </div>

          {/* Right Section - Interview Controls */}
          <div className="w-2/3 bg-white border border-gray-200 rounded-lg p-8">
            <div className="space-y-6">
              {/* Header with microphone icon */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Mic className="w-5 h-5 text-purple-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Your interview is about to begin!
                </h1>
              </div>

              {/* Instructions */}
              <div className="space-y-4 text-gray-600">
                <p>
                  Click the "Start Interview" button to begin the interview. Make sure you are in a quiet, focused setting.
                </p>
                <p>
                  First you'll be asked to grant permission to use your microphone. Hit "allow" to continue.
                </p>
                <p>
                  Once the interview starts, an AI moderator will ask you questions and dynamically respond to your answers. You can interrupt the AI moderator at any time by hitting the "interrupt" button and if you need to take a break, just ask the AI moderator to pause the interview until you're ready to proceed.
                </p>
              </div>

              {/* Buttons */}
              <div className="space-y-4">
                <button
                  onClick={handleStartVoiceInterview}
                  disabled={vapiLoading}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white py-4 text-lg font-semibold rounded-lg shadow-lg border-0 cursor-pointer"
                >
                  {vapiLoading ? "Starting..." : "Start Interview"}
                </button>
                
               
              </div>
            </div>
          </div>
        </div>
      ) : isCallActive ? (
        /* Voice interview layout when call is active */
        <div className="container mx-auto p-4 h-screen flex gap-4">
          {/* Left Section - Media Content */}
          <div className="w-1/3 bg-white border border-gray-200 rounded-lg flex items-center justify-center">
            <div className="text-center space-y-4">
              <p className="text-gray-600 text-lg">
                We'll populate images, videos, and more in this space throughout the interview.
              </p>
              <p className="text-gray-500">
                Stay tuned.
              </p>
            </div>
          </div>

          {/* Right Section - Voice Activity Indicator */}
          <div className="w-2/3 bg-white border border-gray-200 rounded-lg p-8 flex flex-col items-center justify-center space-y-8">
            {/* Voice Activity Bars */}
            <div className="flex items-end space-x-2 h-20">
              {getVoiceBarHeights().map((height, index) => {
                const { isUserSpeaking, isAiSpeaking } = voiceActivity;
                let barColor = 'bg-purple-600'; // Default color
                
                if (isUserSpeaking && !isAiSpeaking) {
                  barColor = 'bg-red-500'; // User speaking - red
                } else if (isAiSpeaking && !isUserSpeaking) {
                  barColor = 'bg-purple-600'; // AI speaking - purple
                } else if (isUserSpeaking && isAiSpeaking) {
                  barColor = 'bg-orange-500'; // Both speaking - orange
                }
                
                return (
                  <div 
                    key={index}
                    className={`w-3 ${barColor} rounded-full transition-all duration-300 ease-in-out`}
                    style={{ 
                      height: `${height}%`
                    }}
                  ></div>
                );
              })}
            </div>

            {/* Interrupt Button */}
            <div className="flex flex-col items-center space-y-2">
              <button
                onClick={handleStopVoiceInterview}
                className="w-12 h-12 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg"
              >
                <Square className="w-6 h-6 text-white" />
              </button>
              <span className="text-sm text-gray-600">Hit to interrupt</span>
            </div>

            {/* Switch to text chat link */}
            <button
              onClick={() => {/* TODO: Implement text chat switch */}}
              className="text-blue-600 underline hover:text-blue-700"
            >
              Switch to text chat
            </button>
          </div>
        </div>
      ) : (
        /* Regular chat layout when messages exist but call is not active */
      <div className="container mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
              <h1 className="text-2xl font-bold">{respondentData?.project?.name}</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>{new Date(respondentData?.project?.created_at || '').toLocaleDateString()}</span>
              <span>•</span>
              <span>In-Depth Interview</span>
                <Badge variant={respondentData?.status === "completed" ? "default" : "secondary"}>
                  {respondentData?.status}
                </Badge>
              </div>
          </div>
          
          {/* Interview Controls */}
          <div className="flex items-center gap-2">
              <Button
                onClick={handleStartVoiceInterview}
                disabled={vapiLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Play className="w-4 h-4 mr-2" />
                {vapiLoading ? "Starting..." : "Start Interview"}
              </Button>
            
            {/* PHASE 1: Debug button for message analysis */}
            {process.env.NODE_ENV === 'development' && (
              <Button
                onClick={exportMessageAnalysis}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                Export Analysis
              </Button>
            )}
          </div>
        </div>

        {/* Chat Window */}
        <Card className="h-[600px]">
          <CardContent className="p-4 h-full flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-6">
              {allMessages.map((message, i) => {
                // Only log rendering for debugging when needed
                if (process.env.NODE_ENV === 'development' && i < 3) {
                  console.log(`Rendering message ${i}:`, message.message?.substring(0, 30));
                }
                // Show AI typing indicator after the last message if AI is responding
                if (i === allMessages.length - 1 && isAiResponding) {
                  return (
                    <div key={`message-group-${message.id || i}`}>
                      {/* Render the last message */}
                      <div key={`message-${message.id || i}`} className={`flex gap-4 items-end ${message.sender_type !== 'respondent' ? "" : "flex-row-reverse"}`}>
                        <div 
                          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-white font-medium"
                          style={{ backgroundColor: message.sender_type === 'respondent' ? '#4CAF50' : '#9238FF' }}
                        >
                          {message.sender_type === 'respondent' ? respondentData?.name[0] : "M"}
                        </div>
                        <div className={`flex-1 ${message.sender_type === 'respondent' ? "text-right" : ""}`}>
                          <div className={`inline-block rounded-lg px-4 py-2 max-w-[80%] ${
                            message.sender_type === 'respondent'
                              ? "bg-primary text-primary-foreground" 
                              : "bg-muted"
                          }`}>
                            {message.sender_type === 'respondent' && (
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-sm text-green-600">
                                  {respondentData?.name}
                                </span>
                                <span className="text-xs text-gray-500 ml-2">
                                  {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            )}
                            {message.sender_type !== 'respondent' && (
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-primary-foreground/70">
                                  {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span className="font-semibold text-sm text-primary-foreground ml-2">
                                  Moderator
                                </span>
                              </div>
                            )}
                        <p className="text-sm">{message.message || 'No message content'}</p>
                        {message.metadata?.isVoice && (
                          <div className="flex items-center gap-1 mt-1">
                            <Mic className="w-3 h-3 text-primary-foreground/70" />
                            <span className="text-xs text-primary-foreground/70">
                              Voice
                              {message.metadata.isInterim && (
                                <span className="ml-1 text-yellow-500">(updating...)</span>
                              )}
                              {message.metadata.isFinal && (
                                <span className="ml-1 text-green-500">(final)</span>
                              )}
                              {message.metadata.isAccumulated && (
                                <span className="ml-1 text-blue-500">(combined)</span>
                              )}
                            </span>
                          </div>
                        )}
                        {/* Debug info - remove in production */}
                        {process.env.NODE_ENV === 'development' && (
                          <div className="text-xs text-gray-400 mt-1 p-2 bg-gray-100 rounded">
                            <div>ID: {message.id}</div>
                            <div>Type: {message.sender_type}</div>
                            <div>Content: "{message.message}"</div>
                            {message.metadata?.rawMessage && (
                              <div>Raw: {JSON.stringify(message.metadata.rawMessage, null, 2)}</div>
                            )}
                          </div>
                        )}
                          </div>
                        </div>
                      </div>
                      
                      {/* AI typing indicator */}
                      <div key="ai-typing-indicator" className="flex gap-4 items-end">
                        <div 
                          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-white font-medium"
                          style={{ backgroundColor: '#9238FF' }}
                        >
                          M
                        </div>
                        <div className="flex-1">
                          <div className="inline-block rounded-lg px-4 py-2 bg-primary/50">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 bg-white rounded-full animate-bounce" />
                              <div className="h-2 w-2 bg-white rounded-full animate-bounce [animation-delay:0.2s]" />
                              <div className="h-2 w-2 bg-white rounded-full animate-bounce [animation-delay:0.4s]" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
                const isRespondent = message.sender_type === 'respondent';
                
                return (
                  <div key={`message-${message.id || i}`} className={`flex gap-4 items-end ${!isRespondent ? "" : "flex-row-reverse"}`}>
                    <div 
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-white font-medium"
                      style={{ backgroundColor: isRespondent ? '#4CAF50' : '#9238FF' }}
                    >
                      {isRespondent ? respondentData?.name[0] : "M"}
                    </div>
                    <div className={`flex-1 ${isRespondent ? "text-right" : ""}`}>
                      <div className={`inline-block rounded-lg px-4 py-2 max-w-[80%] ${
                        isRespondent 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted"
                      }`}>
                        {isRespondent && (
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-sm text-primary-foreground ml-2">
                              {/* {respondentData?.name} */}
                            </span>
                            <span className="text-xs text-primary-foreground/70">
                            {/* <span className="text-xs text-gray-500 ml-2"> */}
                              {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        )}
                        {!isRespondent && (
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-500">
                              {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="font-semibold text-sm text-gray-500 ml-2">
                              Moderator
                            </span>
                          </div>
                        )}
                        <p className="text-sm">{message.message}</p>
                        {message.metadata?.isVoice && (
                          <div className="flex items-center gap-1 mt-1">
                            <Mic className="w-3 h-3 text-primary-foreground/70" />
                            <span className="text-xs text-primary-foreground/70">
                              Voice
                              {message.metadata.isInterim && (
                                <span className="ml-1 text-yellow-500">(updating...)</span>
                              )}
                              {message.metadata.isFinal && (
                                <span className="ml-1 text-green-500">(final)</span>
                              )}
                              {message.metadata.isAccumulated && (
                                <span className="ml-1 text-blue-500">(combined)</span>
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Message Input */}
            <div className="mt-4 border-t pt-4 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                {isCallActive ? (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Mic className="w-4 h-4" />
                    <span>Interview in progress - speak or type your message</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Play className="w-4 h-4" />
                    <span>Ready to start interview - click "Start Interview" to begin</span>
                  </div>
                )}
              </div>
              
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={isCallActive ? "Type your message or speak..." : "Interview will start when you click 'Start Interview'"}
                className="min-h-[100px]"
                disabled={isSending || isAiResponding}
              />
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isSending || isAiResponding}
                  className="flex-1"
                >
                  {isSending ? "Sending..." : isCallActive ? "Send Text Message" : "Send Message"}
                </Button>
                
                {!isCallActive && (
                  <Button
                    onClick={handleStartVoiceInterview}
                    disabled={vapiLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Interview
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      )}
    </div>
  );
}
