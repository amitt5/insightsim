"use client"
import { useParams } from "next/navigation";
import { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useVapi, VapiMessage } from "@/hooks/useVapi"
import { Mic, MicOff, Phone, PhoneOff, AlertCircle } from "lucide-react"

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

  // Combine text messages and VAPI transcript
  const allMessages = useMemo(() => {
    // Only log when there are significant changes
    if (messages.length > 0 || vapiTranscript.length > 0) {
      console.log(`Combining ${messages.length} text messages with ${vapiTranscript.length} VAPI messages`);
    }
    
    const combined = [...messages, ...vapiTranscript];
    
    // Sort by created_at timestamp to maintain chronological order
    const sorted = combined.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    return sorted;
  }, [messages, vapiTranscript]);

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
      await startInterview();
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
        
        // After loading respondent data, fetch messages and start interview
        await fetchMessages();
        
        // If no messages exist, start the interview
        if (!messages.length) {
          await getAiResponse(true);
        }
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{respondentData.project.name}</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{new Date(respondentData.project.created_at).toLocaleDateString()}</span>
              <span>•</span>
              <span>In-Depth Interview</span>
              <Badge variant={respondentData.status === "completed" ? "default" : "secondary"}>
                {respondentData.status}
              </Badge>
              {isCallActive && (
                <Badge variant="default" className="bg-green-500">
                  <Mic className="w-3 h-3 mr-1" />
                  Voice Active
                </Badge>
              )}
            </div>
          </div>
          
          {/* Voice Interview Controls */}
          <div className="flex items-center gap-2">
            {!isCallActive ? (
              <Button
                onClick={handleStartVoiceInterview}
                disabled={vapiLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                <Phone className="w-4 h-4 mr-2" />
                {vapiLoading ? "Starting..." : "Start Voice Interview"}
              </Button>
            ) : (
              <Button
                onClick={handleStopVoiceInterview}
                disabled={vapiLoading}
                variant="destructive"
              >
                <PhoneOff className="w-4 h-4 mr-2" />
                {vapiLoading ? "Stopping..." : "End Voice Interview"}
              </Button>
            )}
            
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

        {/* Error Display */}
        {(error || vapiError) && (
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
        )}

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
                    <span>Voice interview active - speak or type your message</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MicOff className="w-4 h-4" />
                    <span>Text mode - type your message or start voice interview</span>
                  </div>
                )}
              </div>
              
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={isCallActive ? "Type your message or speak..." : "Type your message..."}
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
                    variant="outline"
                    className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Voice
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
