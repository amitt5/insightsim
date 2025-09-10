"use client"
import { useParams } from "next/navigation";
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface HumanRespondent {
  id: string;
  name: string;
  age: number;
  gender: string;
  email: string;
  status: 'in_progress' | 'completed';
  simulation: {
    id: string;
    topic: string;
    discussion_questions: string[];
    created_at: string;
  };
}

export default function InterviewPage() {
  const params = useParams();
  const simulationId = params.id as string;
  const humanRespondentId = params.human_respondent_id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [respondentData, setRespondentData] = useState<HumanRespondent | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isAiResponding, setIsAiResponding] = useState(false);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/public/human-conversations?human_respondent_id=${humanRespondentId}&simulation_id=${simulationId}`);
      
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
          simulation_id: simulationId,
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

    setIsSending(true);
    try {
      const response = await fetch('/api/public/human-conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          simulation_id: simulationId,
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

        // Verify this respondent belongs to this simulation
        if (data.simulation_id !== simulationId) {
          throw new Error('Invalid simulation ID');
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
  }, [simulationId, humanRespondentId]);

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

  if (!respondentData || !respondentData.simulation) {
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
            <h1 className="text-2xl font-bold">{respondentData.simulation.topic}</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{new Date(respondentData.simulation.created_at).toLocaleDateString()}</span>
              <span>•</span>
              <span>In-Depth Interview</span>
              <Badge variant={respondentData.status === "completed" ? "default" : "secondary"}>
                {respondentData.status}
              </Badge>
            </div>
          </div>
        </div>

        {/* Chat Window */}
        <Card className="h-[600px]">
          <CardContent className="p-4 h-full flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-6">
              {messages.map((message, i) => {
                // Show AI typing indicator after the last message if AI is responding
                if (i === messages.length - 1 && isAiResponding) {
                  return (
                    <>
                      {/* Render the last message */}
                      <div key={`message-${i}`} className={`flex gap-4 items-end ${message.sender_type === 'respondent' ? "" : "flex-row-reverse"}`}>
                        <div 
                          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-white font-medium"
                          style={{ backgroundColor: message.sender_type === 'respondent' ? '#4CAF50' : '#9238FF' }}
                        >
                          {message.sender_type === 'respondent' ? respondentData?.name[0] : "M"}
                        </div>
                        <div className={`flex-1 ${message.sender_type !== 'respondent' ? "text-right" : ""}`}>
                          <div className={`inline-block rounded-lg px-4 py-2 max-w-[80%] ${
                            message.sender_type !== 'respondent'
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
                            <p className="text-sm">{message.message}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* AI typing indicator */}
                      <div className="flex gap-4 items-end flex-row-reverse">
                        <div 
                          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-white font-medium"
                          style={{ backgroundColor: '#9238FF' }}
                        >
                          M
                        </div>
                        <div className="flex-1 text-right">
                          <div className="inline-block rounded-lg px-4 py-2 bg-primary/50">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 bg-white rounded-full animate-bounce" />
                              <div className="h-2 w-2 bg-white rounded-full animate-bounce [animation-delay:0.2s]" />
                              <div className="h-2 w-2 bg-white rounded-full animate-bounce [animation-delay:0.4s]" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                }
                const isRespondent = message.sender_type === 'respondent';
                
                return (
                  <div key={i} className={`flex gap-4 items-end ${isRespondent ? "" : "flex-row-reverse"}`}>
                    <div 
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-white font-medium"
                      style={{ backgroundColor: isRespondent ? '#4CAF50' : '#9238FF' }}
                    >
                      {isRespondent ? respondentData?.name[0] : "M"}
                    </div>
                    <div className={`flex-1 ${!isRespondent ? "text-right" : ""}`}>
                      <div className={`inline-block rounded-lg px-4 py-2 max-w-[80%] ${
                        !isRespondent 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted"
                      }`}>
                        {isRespondent && (
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-sm text-green-600">
                              {respondentData?.name}
                            </span>
                            <span className="text-xs text-gray-500 ml-2">
                              {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        )}
                        {!isRespondent && (
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-primary-foreground/70">
                              {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="font-semibold text-sm text-primary-foreground ml-2">
                              Moderator
                            </span>
                          </div>
                        )}
                        <p className="text-sm">{message.message}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Message Input */}
            <div className="mt-4 border-t pt-4 space-y-4">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="min-h-[100px]"
              />
              <Button 
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || isSending}
                className="w-full"
              >
                {isSending ? "Sending..." : "Send Message"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
