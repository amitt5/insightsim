"use client"

import { useState, useEffect, useCallback, useRef } from 'react';
import Vapi from '@vapi-ai/web';

// Message interface compatible with existing InterviewPage component
export interface VapiMessage {
  id: string;
  message: string;
  sender_type: 'respondent' | 'moderator';
  created_at: string;
  message_order?: number;
  metadata?: {
    timestamp: string;
    isVoice?: boolean;
    vapiMessageId?: string;
    rawMessage?: any;
  };
}

// VAPI event types based on the actual SDK
// Note: VAPI SDK uses 'any' type for message events, so we'll be flexible
interface VapiMessageEvent {
  id?: string;
  role?: 'user' | 'assistant' | 'system';
  content?: string;
  message?: string;
  text?: string;
  timestamp?: string;
  type?: string;
  [key: string]: any; // Allow for additional properties
}

interface VapiErrorEvent {
  message?: string;
  error?: string;
  code?: string;
  [key: string]: any;
}

// Hook return interface
export interface UseVapiReturn {
  // State
  isCallActive: boolean;
  transcript: VapiMessage[];
  error: string | null;
  isLoading: boolean;
  
  // Functions
  startInterview: () => Promise<void>;
  stopInterview: () => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  
  // Utility functions
  clearError: () => void;
  clearTranscript: () => void;
}

export function useVapi(): UseVapiReturn {
  // State management
  const [isCallActive, setIsCallActive] = useState(false);
  const [transcript, setTranscript] = useState<VapiMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Refs for VAPI client and cleanup
  const vapiRef = useRef<Vapi | null>(null);
  const isInitializedRef = useRef(false);
  const lastMessageRef = useRef<string>('');
  const messageCountRef = useRef<number>(0);

  // Initialize VAPI client
  const initializeVapi = useCallback(() => {
    if (isInitializedRef.current || vapiRef.current) {
      return;
    }

    try {
      const apiKey = process.env.NEXT_PUBLIC_VAPI_API_KEY;
      const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;

      if (!apiKey || !assistantId) {
        throw new Error('VAPI API key or Assistant ID not found in environment variables');
      }

      // Initialize VAPI client
      const vapi = new Vapi(apiKey);
      vapiRef.current = vapi;
      isInitializedRef.current = true;

      // Set up event listeners
      vapi.on('call-start', () => {
        console.log('VAPI call started');
        setIsCallActive(true);
        setError(null);
        // Reset message tracking for new call
        lastMessageRef.current = '';
        messageCountRef.current = 0;
      });

      vapi.on('call-end', () => {
        console.log('VAPI call ended');
        setIsCallActive(false);
        // Reset message tracking
        lastMessageRef.current = '';
        messageCountRef.current = 0;
      });

      vapi.on('message', (message: any) => {
        messageCountRef.current += 1;
        
        // Only log every 100th message to reduce spam
        if (messageCountRef.current % 100 === 0) {
          console.log(`VAPI message #${messageCountRef.current} received:`, message);
        }
        
        // Extract content from various possible fields
        const content = message.content || message.message || message.text || message.transcript;
        const role = message.role || message.speaker || 'assistant';
        const messageId = message.id || message.messageId;
        const timestamp = message.timestamp || message.createdAt || new Date().toISOString();
        
        // Skip messages with no content or very short content (likely partial transcripts)
        if (!content || content.trim().length < 3) {
          return;
        }
        
        // Skip duplicate messages (same content as last message)
        if (content === lastMessageRef.current) {
          return;
        }
        
        // Skip messages that are just punctuation or very short
        if (content.trim().length < 3 || /^[.,!?;:\s]+$/.test(content.trim())) {
          return;
        }
        
        // Update last message reference
        lastMessageRef.current = content;
        
        // Only log meaningful messages
        console.log('Adding meaningful VAPI message:', {
          content: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
          role,
          messageId
        });
        
        // Convert VAPI message to our message format
        const vapiMessage: VapiMessage = {
          id: messageId || `vapi-${Date.now()}-${Math.random()}`,
          message: content,
          sender_type: role === 'user' ? 'respondent' : 'moderator',
          created_at: timestamp,
          metadata: {
            timestamp: timestamp,
            isVoice: true,
            vapiMessageId: messageId
          }
        };

        // Add message to transcript
        setTranscript(prev => {
          // Check if we already have this message (by content and role)
          const isDuplicate = prev.some(existing => 
            existing.message === content && 
            existing.sender_type === vapiMessage.sender_type &&
            Math.abs(new Date(existing.created_at).getTime() - new Date(timestamp).getTime()) < 5000 // Within 5 seconds
          );
          
          if (isDuplicate) {
            return prev;
          }
          
          return [...prev, vapiMessage];
        });
      });

      vapi.on('error', (error: VapiErrorEvent) => {
        console.error('VAPI error:', error);
        setError(error.message || 'An error occurred with the voice service');
        setIsCallActive(false);
      });

      // Additional error handling for call start failures
      vapi.on('call-start-failed', (event: any) => {
        console.error('VAPI call start failed:', event);
        setError('Call failed to start. Please check your internet connection and try again.');
        setIsCallActive(false);
      });

    } catch (err) {
      console.error('Failed to initialize VAPI:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize voice service');
    }
  }, []);

  // Start interview function
  const startInterview = useCallback(async () => {
    if (!vapiRef.current) {
      initializeVapi();
    }

    if (!vapiRef.current) {
      setError('Failed to initialize voice service');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
      if (!assistantId) {
        throw new Error('Assistant ID not found');
      }

      // Start the call
      await vapiRef.current.start(assistantId);
      
    } catch (err) {
      console.error('Failed to start interview:', err);
      setError(err instanceof Error ? err.message : 'Failed to start voice interview');
      setIsCallActive(false);
    } finally {
      setIsLoading(false);
    }
  }, [initializeVapi]);

  // Stop interview function
  const stopInterview = useCallback(async () => {
    if (!vapiRef.current) {
      return;
    }

    try {
      setIsLoading(true);
      await vapiRef.current.stop();
      setIsCallActive(false);
    } catch (err) {
      console.error('Failed to stop interview:', err);
      setError(err instanceof Error ? err.message : 'Failed to stop voice interview');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Send message function
  const sendMessage = useCallback(async (text: string) => {
    if (!vapiRef.current || !isCallActive) {
      setError('Voice session is not active');
      return;
    }

    if (!text.trim()) {
      return;
    }

    try {
      // Send message to VAPI assistant
      vapiRef.current.send({
        type: 'add-message',
        message: {
          role: 'user',
          content: text.trim()
        }
      });

      // Add user message to transcript immediately
      const userMessage: VapiMessage = {
        id: `user-${Date.now()}-${Math.random()}`,
        message: text.trim(),
        sender_type: 'respondent',
        created_at: new Date().toISOString(),
        metadata: {
          timestamp: new Date().toISOString(),
          isVoice: true
        }
      };

      setTranscript(prev => [...prev, userMessage]);
      
    } catch (err) {
      console.error('Failed to send message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    }
  }, [isCallActive]);

  // Utility functions
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (vapiRef.current) {
        try {
          vapiRef.current.stop();
        } catch (err) {
          console.error('Error during cleanup:', err);
        }
        vapiRef.current = null;
        isInitializedRef.current = false;
      }
    };
  }, []);

  // Initialize VAPI on mount
  useEffect(() => {
    initializeVapi();
  }, [initializeVapi]);

  return {
    // State
    isCallActive,
    transcript,
    error,
    isLoading,
    
    // Functions
    startInterview,
    stopInterview,
    sendMessage,
    
    // Utility functions
    clearError,
    clearTranscript
  };
}
