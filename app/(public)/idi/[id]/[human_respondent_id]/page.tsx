"use client"
import { useParams } from "next/navigation";
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Mic, MicOff, Volume2, VolumeX, Settings, Play, Pause, Square } from "lucide-react"
import { useTTS } from "@/hooks/useTTS"
import { useSTT } from "@/hooks/useSTT"

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

  // Voice state management
  const [isRecording, setIsRecording] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [currentPlayingMessage, setCurrentPlayingMessage] = useState<string | null>(null);
  const [voiceSettings, setVoiceSettings] = useState({
    volume: 0.8,
    speed: 1.0,
    voice: 'ys3XeJJA4ArWMhRpcX1D'
  });

  // TTS hook
  const { isPlaying, playText, stopPlayback, error: ttsError } = useTTS();

  // STT hook
  const { 
    isListening, 
    transcript, 
    interimTranscript, 
    startListening, 
    stopListening, 
    resetTranscript, 
    error: sttError, 
    isSupported: sttSupported 
  } = useSTT();

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
      
      // Auto-play the AI response if voice is enabled
      if (isVoiceEnabled && data.message) {
        setTimeout(async () => {
          await playText(data.message, {
            volume: voiceSettings.volume,
            speed: voiceSettings.speed,
            voice: voiceSettings.voice
          });
        }, 500); // Small delay to ensure message is rendered
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

  // Voice control functions
  const handleStartRecording = () => {
    if (!sttSupported) {
      setError('Voice input not supported in this browser');
      return;
    }
    
    resetTranscript();
    startListening();
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    stopListening();
    setIsRecording(false);
    
    // Add the final transcript to the message input
    if (transcript.trim()) {
      setNewMessage(prev => prev + (prev ? ' ' : '') + transcript.trim());
    }
  };

  const handlePlayMessage = async (messageId: string, messageText: string) => {
    if (isPlaying && currentPlayingMessage === messageId) {
      // Stop current playback
      stopPlayback();
      setCurrentPlayingMessage(null);
    } else {
      // Start new playback
      setCurrentPlayingMessage(messageId);
      await playText(messageText, {
        volume: voiceSettings.volume,
        speed: voiceSettings.speed,
        voice: voiceSettings.voice
      });
    }
  };

  const handleStopPlayback = () => {
    stopPlayback();
    setCurrentPlayingMessage(null);
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
            </div>
          </div>
          
          {/* Voice Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={isVoiceEnabled ? () => setIsVoiceEnabled(false) : () => setIsVoiceEnabled(true)}
                className="h-8 w-8 p-0"
              >
                {isVoiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
              
              {isVoiceEnabled && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={isPlaying ? handleStopPlayback : undefined}
                    className="h-8 w-8 p-0"
                    disabled={!isPlaying}
                  >
                    {isPlaying ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={isRecording ? handleStopRecording : handleStartRecording}
                    className={`h-8 w-8 p-0 ${isRecording ? 'bg-red-100 text-red-600' : ''}`}
                  >
                    {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                </>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Voice Error Display */}
        {(ttsError || sttError) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2">
              <VolumeX className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-600">
                {ttsError ? `Voice Output Error: ${ttsError}` : `Voice Input Error: ${sttError}`}
              </span>
            </div>
          </div>
        )}

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
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-gray-500">
                                Moderator
                              </span>
                              {isVoiceEnabled && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handlePlayMessage(message.id, message.message)}
                                  className="h-6 w-6 p-0 hover:bg-gray-200"
                                >
                                  {isPlaying && currentPlayingMessage === message.id ? (
                                    <Pause className="h-3 w-3" />
                                  ) : (
                                    <Play className="h-3 w-3" />
                                  )}
                                </Button>
                              )}
                            </div>
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
              {/* Voice Recording Indicator */}
              {isRecording && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-red-600 font-medium">Recording...</span>
                    <div className="flex items-center gap-1 ml-auto">
                      <div className="h-2 w-1 bg-red-400 rounded animate-pulse"></div>
                      <div className="h-3 w-1 bg-red-500 rounded animate-pulse [animation-delay:0.1s]"></div>
                      <div className="h-2 w-1 bg-red-400 rounded animate-pulse [animation-delay:0.2s]"></div>
                      <div className="h-4 w-1 bg-red-600 rounded animate-pulse [animation-delay:0.3s]"></div>
                      <div className="h-2 w-1 bg-red-400 rounded animate-pulse [animation-delay:0.4s]"></div>
                    </div>
                  </div>
                  
                  {/* Real-time transcription */}
                  {(transcript || interimTranscript) && (
                    <div className="text-sm text-gray-700 bg-white p-2 rounded border">
                      <span className="text-gray-600">You said: </span>
                      <span className="font-medium">{transcript}</span>
                      {interimTranscript && (
                        <span className="text-gray-400 italic">{interimTranscript}</span>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={isRecording ? "Voice recording in progress..." : "Type your message..."}
                className="min-h-[100px]"
                disabled={isRecording}
              />
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isSending || isRecording}
                  className="flex-1"
                >
                  {isSending ? "Sending..." : "Send Message"}
                </Button>
                
                {isVoiceEnabled && sttSupported && (
                  <Button
                    variant={isRecording ? "destructive" : "outline"}
                    onClick={isRecording ? handleStopRecording : handleStartRecording}
                    className="px-4"
                  >
                    {isRecording ? (
                      <>
                        <MicOff className="h-4 w-4 mr-2" />
                        Stop Recording
                      </>
                    ) : (
                      <>
                        <Mic className="h-4 w-4 mr-2" />
                        Voice Input
                      </>
                    )}
                  </Button>
                )}
                
                {isVoiceEnabled && !sttSupported && (
                  <Button
                    variant="outline"
                    disabled
                    className="px-4"
                    title="Voice input not supported in this browser"
                  >
                    <MicOff className="h-4 w-4 mr-2" />
                    Voice Input (Not Supported)
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
