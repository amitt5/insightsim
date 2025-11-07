"use client"
import { useParams } from "next/navigation";
import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface UploadedInterview {
  id: string;
  original_filename: string;
  file_type: 'transcript' | 'audio';
  status: 'uploaded' | 'processing' | 'processed' | 'error';
  transcript_text: string | null;
  created_at: string;
  project: {
    id: string;
    name: string;
  };
}

interface ParsedMessage {
  speaker: string;
  text: string;
  timestamp: string;
}

export default function UploadedInterviewPage() {
  const params = useParams();
  const projectId = params.id as string;
  const interviewId = params.interviewId as string;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interviewData, setInterviewData] = useState<UploadedInterview | null>(null);
  const [messages, setMessages] = useState<ParsedMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Parse transcript text into messages with speaker labels
  const parseTranscript = (transcriptText: string): ParsedMessage[] => {
    if (!transcriptText) return [];

    // Split by double newlines to get individual utterances
    const utterances = transcriptText.split('\n\n').filter(line => line.trim().length > 0);
    
    const parsedMessages: ParsedMessage[] = [];
    let currentTime = 0; // Start at 00:00

    utterances.forEach((utterance) => {
      // Match pattern: "Speaker X: text here"
      const match = utterance.match(/^Speaker\s+([A-Z]):\s*(.+)$/i);
      
      if (match) {
        const speaker = match[1].toUpperCase();
        const text = match[2].trim();
        
        // Format timestamp as MM:SS
        const minutes = Math.floor(currentTime / 60);
        const seconds = currentTime % 60;
        const timestamp = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        parsedMessages.push({
          speaker,
          text,
          timestamp
        });
        
        // Increment time by 5 seconds for next message
        currentTime += 5;
      } else {
        // If pattern doesn't match, try to extract speaker from line
        // Fallback: treat as continuation or unknown speaker
        const fallbackMatch = utterance.match(/^([A-Z]):\s*(.+)$/i);
        if (fallbackMatch) {
          const speaker = fallbackMatch[1].toUpperCase();
          const text = fallbackMatch[2].trim();
          
          const minutes = Math.floor(currentTime / 60);
          const seconds = currentTime % 60;
          const timestamp = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
          
          parsedMessages.push({
            speaker,
            text,
            timestamp
          });
          
          currentTime += 5;
        }
      }
    });

    return parsedMessages;
  };

  const fetchInterviewData = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/uploaded-interviews`);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      const interview = (data.interviews || []).find((i: UploadedInterview) => i.id === interviewId);
      
      if (!interview) {
        throw new Error('Interview not found');
      }

      // Verify this interview belongs to this project
      if (interview.project?.id !== projectId) {
        throw new Error('Invalid project ID');
      }
      
      setInterviewData(interview);
      
      // Parse transcript if available
      if (interview.transcript_text) {
        const parsedMessages = parseTranscript(interview.transcript_text);
        setMessages(parsedMessages);
      }
      
      return interview;
    } catch (err: any) {
      console.error("Failed to fetch interview data:", err);
      throw err;
    }
  };

  const handleCopyTranscript = async () => {
    try {
      if (!interviewData?.transcript_text) return;
      
      await navigator.clipboard.writeText(interviewData.transcript_text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy transcript:', err);
    }
  };

  // Get unique speakers for avatar colors
  const getSpeakerColor = (speaker: string): string => {
    const colors = [
      '#9238FF', // Purple
      '#4CAF50', // Green
      '#2196F3', // Blue
      '#FF9800', // Orange
      '#E91E63', // Pink
      '#00BCD4', // Cyan
      '#9C27B0', // Purple
      '#F44336', // Red
    ];
    const index = speaker.charCodeAt(0) - 65; // A=0, B=1, etc.
    return colors[index % colors.length];
  };

  useEffect(() => {
    let isMounted = true;

    const initializeInterview = async () => {
      try {
        setIsLoading(true);
        const data = await fetchInterviewData();
        
        if (!isMounted) return;
        
        setInterviewData(data);
        setError(null);
      } catch (err: any) {
        if (!isMounted) return;
        console.error("Failed to fetch interview data:", err);
        setError(err.message || "Failed to load interview data");
        setInterviewData(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    initializeInterview();

    return () => {
      isMounted = false;
    };
  }, [projectId, interviewId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  if (!interviewData || !interviewData.project) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
        <div className="text-xl font-semibold">Interview not found</div>
      </div>
    );
  }

  if (!interviewData.transcript_text) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
        <div className="text-xl font-semibold">No transcript available</div>
        <div className="text-gray-500">
          {interviewData.status === 'processing' 
            ? 'Transcription is in progress. Please check back later.'
            : 'This interview does not have a transcript yet.'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{interviewData.project.name}</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{new Date(interviewData.created_at).toLocaleDateString()}</span>
              <span>•</span>
              <span>Uploaded Interview</span>
              <Badge variant={interviewData.status === "processed" ? "default" : "secondary"}>
                {interviewData.status}
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
                const speakerColor = getSpeakerColor(message.speaker);
                
                return (
                  <div key={`message-${i}`} className="flex gap-4 items-end flex-row-reverse">
                    <div 
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-white font-medium"
                      style={{ backgroundColor: speakerColor }}
                    >
                      {message.speaker}
                    </div>
                    <div className="flex-1 text-right">
                      <div className="inline-block rounded-lg px-4 py-2 max-w-[80%] bg-primary text-primary-foreground">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-sm text-primary-foreground ml-2">
                            Speaker {message.speaker}
                          </span>
                          <span className="text-xs text-primary-foreground/70">
                            {message.timestamp}
                          </span>
                        </div>
                        <p className="text-sm">{message.text}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

