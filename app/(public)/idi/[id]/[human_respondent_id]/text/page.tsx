"use client"
import { useParams } from "next/navigation";
import { useState, useEffect, useRef } from "react"
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
  const isInitializingRef = useRef(false); // Prevent duplicate initialization calls

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/public/human-conversations?human_respondent_id=${humanRespondentId}&project_id=${projectId}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching messages: ${response.status}`);
      }
      
      const data = await response.json();
      const messagesList = data.messages || [];
      setMessages(messagesList);
      return messagesList; // Return messages for immediate use
    } catch (err) {
      console.error("Error fetching messages:", err);
      return [];
    }
  };

  const fetchRespondentData = async () => {
    try {
      const response = await fetch(`/api/public/human-respondents/${humanRespondentId}`);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      // Verify this respondent belongs to this project
      if (data.project_id !== projectId) {
        throw new Error('Invalid project ID');
      }
      
      setRespondentData(data);
      return data;
    } catch (err: any) {
      console.error("Failed to fetch respondent data:", err);
      throw err;
    }
  };

  const getAiResponse = async (isFirstMessage: boolean = false) => {
    // Double-check: verify no moderator message exists before creating one
    if (isFirstMessage) {
      const currentMessages = await fetchMessages();
      const hasModeratorMessage = currentMessages.some((msg: any) => msg.sender_type === 'moderator');
      if (hasModeratorMessage) {
        // Moderator message already exists, don't create another one
        return;
      }
    }

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
      
      // If interview was completed, refresh respondent data to get updated status
      if (data.interview_completed) {
        await fetchRespondentData();
      }
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

  const handleCopyTranscript = async () => {
    try {
      const transcript = messages
        .map((message) => {
          const who = message.sender_type === 'respondent' ? (respondentData?.name || 'Respondent') : 'Moderator';
          const time = message.created_at ? new Date(message.created_at).toLocaleString() : '';
          return `${who}${time ? ` [${time}]` : ''}: ${message.message}`;
        })
        .join("\n");
      await navigator.clipboard.writeText(transcript);
    } catch (err) {
      console.error('Failed to copy transcript:', err);
    }
  };

  const handleEndInterview = async () => {
    if (!confirm('Are you sure you want to end this interview? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/public/human-respondents/${humanRespondentId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to end interview');
      }

      // Refresh respondent data to get updated status
      await fetchRespondentData();
    } catch (err) {
      console.error('Error ending interview:', err);
      setError('Failed to end interview. Please try again.');
    }
  };

  useEffect(() => {
    // Prevent duplicate initialization calls
    if (isInitializingRef.current) {
      return;
    }

    let isMounted = true; // Track if component is still mounted

    const initializeInterview = async () => {
      try {
        isInitializingRef.current = true;
        setIsLoading(true);
        
        const data = await fetchRespondentData();
        
        if (!isMounted) return;
        
        setRespondentData(data);
        setError(null);
        
        // After loading respondent data, fetch messages and check conversation state
        const fetchedMessages = await fetchMessages();
        
        if (!isMounted) return;
        
        // Check if any moderator message already exists (prevents duplicate first question)
        const hasModeratorMessage = fetchedMessages.some((msg: any) => msg.sender_type === 'moderator');
        
        // Only start the interview if:
        // 1. No messages exist (new interview) AND no moderator message exists, OR
        // 2. Last message is from respondent (AI should follow up)
        // Don't ask again if last message is from moderator (waiting for user reply)
        const shouldStartInterview = fetchedMessages.length === 0 && !hasModeratorMessage;
        const lastMessage = fetchedMessages[fetchedMessages.length - 1];
        const lastMessageIsFromRespondent = lastMessage?.sender_type === 'respondent';
        
        if (shouldStartInterview) {
          // New interview - start with first message
          await getAiResponse(true);
        } else if (lastMessageIsFromRespondent) {
          // Last message is from respondent - AI should respond
          await getAiResponse(false);
        }
        // If last message is from moderator, don't call getAiResponse - wait for user reply
      } catch (err: any) {
        if (!isMounted) return;
        console.error("Failed to fetch respondent data:", err);
        setError(err.message || "Failed to load interview data");
        setRespondentData(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
        isInitializingRef.current = false;
      }
    };
    
    initializeInterview();

    // Cleanup function
    return () => {
      isMounted = false;
      isInitializingRef.current = false;
    };
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
              
            </div>
            <div className="mt-2">
              <Button variant="outline" size="sm" onClick={handleCopyTranscript}>
                Copy transcript
              </Button>
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
                            <p className="text-sm">{message.message}</p>
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
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Message Input */}
            <div className="mt-4 border-t pt-4 space-y-4">
              {respondentData?.status === 'completed' ? (
                <div className="text-center py-4 text-sm text-gray-500">
                  Interview completed. Thank you for participating!
                </div>
              ) : (
                <>
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="min-h-[100px]"
                    disabled={!respondentData}
                  />
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || isSending || isAiResponding || !respondentData}
                      className="flex-1"
                    >
                      {isSending ? "Sending..." : "Send Message"}
                    </Button>
                    <Button 
                      onClick={handleEndInterview}
                      disabled={isSending || isAiResponding || !respondentData}
                      variant="outline"
                      className="px-4"
                    >
                      End Interview
                    </Button>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
