"use client"

import { useState, useEffect, useCallback, useRef } from 'react';
import Vapi from '@vapi-ai/web';
import { 
  saveVoiceMessage, 
  saveVoiceMessageBatch, 
  createVoiceSession, 
  updateVoiceSession,
  createVoiceMessageData,
  generateVoiceSessionId 
} from '@/utils/voiceApi';

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
    transcriptType?: string;
    isInterim?: boolean;
    isFinal?: boolean;
    isAccumulated?: boolean;
    lastUpdate?: string;
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
  startInterview: (respondentName?: string, discussionGuide?: string[], projectId?: string, humanRespondentId?: string) => Promise<void>;
  stopInterview: () => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  
  // Utility functions
  clearError: () => void;
  clearTranscript: () => void;
  
  // PHASE 1: Debug functions
  exportMessageAnalysis: () => any;
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
  const messageHistoryRef = useRef<any[]>([]);
  const lastMessageTimeRef = useRef<number>(0);
  
  // PHASE 2: Message buffering and coalescing
  const messageBufferRef = useRef<Map<string, VapiMessage>>(new Map());
  const bufferTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastProcessedMessageRef = useRef<string>('');
  
  // PHASE 3: Speaker-based message accumulation
  const currentSpeakerRef = useRef<string>('');
  const currentSpeakerMessageRef = useRef<VapiMessage | null>(null);
  
  // PHASE 3: Database persistence
  const voiceSessionIdRef = useRef<string>('');
  const projectIdRef = useRef<string>('');
  const humanRespondentIdRef = useRef<string>('');
  const messageQueueRef = useRef<any[]>([]);
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryQueueRef = useRef<any[]>([]);
  const isSavingRef = useRef<boolean>(false);
  const saveBatchMessagesRef = useRef<(() => Promise<void>) | null>(null);

  // PHASE 3: Database persistence functions (moved before processSpeakerMessage)
  const queueMessageForSaving = useCallback((message: VapiMessage) => {
    // Only save final messages to avoid spam
    if (message.metadata?.isFinal || message.metadata?.transcriptType === 'final') {
      messageQueueRef.current.push(message);
      
      // Clear existing timeout and set new one for batch saving
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
      
      batchTimeoutRef.current = setTimeout(() => {
        // Use ref to avoid circular dependency
        if (messageQueueRef.current.length > 0 && saveBatchMessagesRef.current) {
          saveBatchMessagesRef.current();
        }
      }, 2000); // Save batch every 2 seconds
    }
  }, []);

  const saveBatchMessages = useCallback(async () => {
    if (messageQueueRef.current.length === 0 || isSavingRef.current) {
      return;
    }

    isSavingRef.current = true;
    const messagesToSave = [...messageQueueRef.current];
    messageQueueRef.current = [];

    try {
      const messageDataArray = messagesToSave.map(message => 
        createVoiceMessageData(
          message.metadata?.rawMessage || {},
          projectIdRef.current,
          humanRespondentIdRef.current,
          voiceSessionIdRef.current
        )
      );

      // Override with actual message data
      messageDataArray.forEach((data, index) => {
        data.message = messagesToSave[index].message;
        data.sender_type = messagesToSave[index].sender_type;
      });

      await saveVoiceMessageBatch(messageDataArray);
      console.log('✅ Batch saved', messagesToSave.length, 'messages to database');
    } catch (error) {
      console.error('❌ Failed to save batch messages:', error);
      // Add failed messages back to queue
      messageQueueRef.current.unshift(...messagesToSave);
    } finally {
      isSavingRef.current = false;
    }
  }, []);

  // Assign function to ref to avoid circular dependency
  saveBatchMessagesRef.current = saveBatchMessages;

  // PHASE 2: Message processing helper functions
  const processBufferedMessage = useCallback((message: VapiMessage, speakerKey: string) => {
    console.log('Processing buffered message:', message.message.substring(0, 50) + '...');
    
    setTranscript(prev => {
      // Find and replace the last interim message from this speaker, or add new one
      const speakerType = message.sender_type;
      const lastMessageIndex = prev.findLastIndex(m => m.sender_type === speakerType);
      
      if (lastMessageIndex >= 0 && prev[lastMessageIndex].metadata?.isInterim) {
        // Replace the last interim message
        const updated = [...prev];
        updated[lastMessageIndex] = message;
        console.log('REPLACED: Interim message at index', lastMessageIndex);
        return updated;
      } else {
        // Add as new message
        console.log('ADDED: New buffered message');
        return [...prev, message];
      }
    });
  }, []);

  const processFinalMessage = useCallback((message: VapiMessage) => {
    console.log('Processing final message:', message.message.substring(0, 50) + '...');
    
    setTranscript(prev => {
      const speakerType = message.sender_type;
      const lastMessageIndex = prev.findLastIndex(m => m.sender_type === speakerType);
      
      if (lastMessageIndex >= 0 && prev[lastMessageIndex].metadata?.isInterim) {
        // Replace the last interim message with final
        const updated = [...prev];
        updated[lastMessageIndex] = message;
        console.log('REPLACED: Interim with final message at index', lastMessageIndex);
        return updated;
      } else {
        // Add as new message
        console.log('ADDED: New final message');
        return [...prev, message];
      }
    });
  }, []);

  const processLegacyMessage = useCallback((message: VapiMessage) => {
    console.log('Processing legacy message:', message.message.substring(0, 50) + '...');
    
    setTranscript(prev => {
      // Check for duplicates
      const isDuplicate = prev.some(existing => 
        existing.message === message.message && 
        existing.sender_type === message.sender_type &&
        Math.abs(new Date(existing.created_at).getTime() - new Date(message.created_at).getTime()) < 5000
      );
      
      if (isDuplicate) {
        console.log('SKIPPED: Duplicate legacy message');
        return prev;
      }
      
      console.log('ADDED: New legacy message');
      return [...prev, message];
    });
  }, []);

  // PHASE 3: Speaker-based message accumulation
  const processSpeakerMessage = useCallback((message: VapiMessage) => {
    const speakerType = message.sender_type;
    const currentSpeaker = currentSpeakerRef.current;
    
    console.log('PHASE 3: Processing speaker message:', {
      speakerType,
      currentSpeaker,
      message: message.message.substring(0, 50) + '...'
    });
    
    setTranscript(prev => {
      // If same speaker, accumulate the message
      if (currentSpeaker === speakerType && currentSpeakerMessageRef.current) {
        console.log('ACCUMULATING: Same speaker, appending to existing message');
        
        // Find the last message from this speaker
        const lastMessageIndex = prev.findLastIndex(m => m.sender_type === speakerType);
        
        if (lastMessageIndex >= 0) {
          const updated = [...prev];
          const existingMessage = updated[lastMessageIndex];
          
          // Combine messages with proper spacing
          const combinedText = `${existingMessage.message} ${message.message}`.replace(/\s+/g, ' ').trim();
          
          updated[lastMessageIndex] = {
            ...existingMessage,
            message: combinedText,
            metadata: {
              ...existingMessage.metadata,
              timestamp: existingMessage.metadata?.timestamp || new Date().toISOString(),
              isAccumulated: true,
              lastUpdate: new Date().toISOString()
            }
          };
          
          // Update current speaker message reference
          currentSpeakerMessageRef.current = updated[lastMessageIndex];
          
          console.log('UPDATED: Combined message length:', combinedText.length);
          return updated;
        }
      }
      
      // Different speaker or first message, add as new message
      console.log('ADDING: New message for speaker:', speakerType);
      
      // Update speaker tracking
      currentSpeakerRef.current = speakerType;
      currentSpeakerMessageRef.current = message;
      
      return [...prev, message];
    });
    
    // Queue message for database saving
    queueMessageForSaving(message);
  }, [queueMessageForSaving]);

  // PHASE 3: Database persistence functions
  const saveMessageToDatabase = useCallback(async (message: VapiMessage) => {
    if (!projectIdRef.current || !humanRespondentIdRef.current) {
      console.warn('Cannot save message: missing project or respondent ID');
      return;
    }

    try {
      const messageData = createVoiceMessageData(
        message.metadata?.rawMessage || {},
        projectIdRef.current,
        humanRespondentIdRef.current,
        voiceSessionIdRef.current
      );

      // Override with actual message data
      messageData.message = message.message;
      messageData.sender_type = message.sender_type;

      await saveVoiceMessage(messageData);
      console.log('✅ Message saved to database:', message.message.substring(0, 50) + '...');
    } catch (error) {
      console.error('❌ Failed to save message to database:', error);
      // Add to retry queue
      retryQueueRef.current.push(message);
    }
  }, []);

  const createVoiceSessionInDatabase = useCallback(async () => {
    if (!projectIdRef.current || !humanRespondentIdRef.current) {
      console.warn('Cannot create voice session: missing project or respondent ID');
      return;
    }

    try {
      const sessionId = generateVoiceSessionId();
      voiceSessionIdRef.current = sessionId;

      await createVoiceSession({
        project_id: projectIdRef.current,
        human_respondent_id: humanRespondentIdRef.current,
        vapi_call_id: `vapi_call_${Date.now()}`,
        assistant_id: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID,
        metadata: {
          created_by: 'useVapi_hook',
          timestamp: new Date().toISOString()
        }
      });

      console.log('✅ Voice session created:', sessionId);
    } catch (error) {
      console.error('❌ Failed to create voice session:', error);
    }
  }, []);

  const updateVoiceSessionStatus = useCallback(async (status: 'started' | 'in_progress' | 'ended' | 'failed') => {
    if (!voiceSessionIdRef.current) {
      return;
    }

    try {
      await updateVoiceSession(voiceSessionIdRef.current, {
        status,
        ended_at: status === 'ended' ? new Date().toISOString() : undefined
      });
      console.log('✅ Voice session status updated:', status);
    } catch (error) {
      console.error('❌ Failed to update voice session status:', error);
    }
  }, []);

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
        messageHistoryRef.current = [];
        lastMessageTimeRef.current = 0;
        
        // PHASE 2: Reset buffering state
        messageBufferRef.current.clear();
        if (bufferTimeoutRef.current) {
          clearTimeout(bufferTimeoutRef.current);
          bufferTimeoutRef.current = null;
        }
        lastProcessedMessageRef.current = '';
        
        // PHASE 3: Reset speaker tracking
        currentSpeakerRef.current = '';
        currentSpeakerMessageRef.current = null;
        
        // PHASE 3: Update voice session status
        updateVoiceSessionStatus('in_progress');
      });

      vapi.on('call-end', () => {
        console.log('VAPI call ended');
        setIsCallActive(false);
        // Reset message tracking
        lastMessageRef.current = '';
        messageCountRef.current = 0;
        messageHistoryRef.current = [];
        lastMessageTimeRef.current = 0;
        
        // PHASE 2: Reset buffering state
        messageBufferRef.current.clear();
        if (bufferTimeoutRef.current) {
          clearTimeout(bufferTimeoutRef.current);
          bufferTimeoutRef.current = null;
        }
        lastProcessedMessageRef.current = '';
        
        // PHASE 3: Reset speaker tracking
        currentSpeakerRef.current = '';
        currentSpeakerMessageRef.current = null;
        
        // PHASE 3: Save remaining messages and update session status
        if (messageQueueRef.current.length > 0) {
          saveBatchMessages();
        }
        updateVoiceSessionStatus('ended');
      });

      vapi.on('message', (message: any) => {
        messageCountRef.current += 1;
        
        // PHASE 1: Comprehensive message analysis and logging
        console.log(`\n=== VAPI MESSAGE #${messageCountRef.current} ===`);
        console.log('Raw message object:', message);
        console.log('Message type:', typeof message);
        console.log('Message keys:', Object.keys(message));
        
        // Log all possible fields we might need
        console.log('=== MESSAGE FIELD ANALYSIS ===');
        console.log('id:', message.id);
        console.log('messageId:', message.messageId);
        console.log('type:', message.type);
        console.log('role:', message.role);
        console.log('speaker:', message.speaker);
        console.log('content:', message.content);
        console.log('message:', message.message);
        console.log('text:', message.text);
        console.log('transcript:', message.transcript);
        console.log('timestamp:', message.timestamp);
        console.log('createdAt:', message.createdAt);
        console.log('confidence:', message.confidence);
        console.log('isFinal:', message.isFinal);
        console.log('final:', message.final);
        console.log('interim:', message.interim);
        console.log('status:', message.status);
        console.log('sequence:', message.sequence);
        console.log('duration:', message.duration);
        console.log('startTime:', message.startTime);
        console.log('endTime:', message.endTime);
        
        // Log nested objects
        if (message.metadata) {
          console.log('metadata:', message.metadata);
        }
        if (message.audio) {
          console.log('audio:', message.audio);
        }
        if (message.voice) {
          console.log('voice:', message.voice);
        }
        
        // Log any other properties we might have missed
        const knownFields = ['id', 'messageId', 'type', 'role', 'speaker', 'content', 'message', 'text', 'transcript', 'timestamp', 'createdAt', 'confidence', 'isFinal', 'final', 'interim', 'status', 'sequence', 'duration', 'startTime', 'endTime', 'metadata', 'audio', 'voice'];
        const unknownFields = Object.keys(message).filter(key => !knownFields.includes(key));
        if (unknownFields.length > 0) {
          console.log('Unknown fields:', unknownFields);
          unknownFields.forEach(field => {
            console.log(`${field}:`, message[field]);
          });
        }
        
        console.log('=== END MESSAGE ANALYSIS ===\n');
        
        // PHASE 1: Message type detection and analysis
        const messageAnalysis = {
          isInterim: false,
          isFinal: false,
          confidence: null,
          messageType: 'unknown',
          hasContent: false,
          contentLength: 0
        };
        
        // PHASE 2: Detect transcript type based on VAPI structure
        if (message.transcriptType === 'partial') {
          messageAnalysis.isInterim = true;
          messageAnalysis.messageType = 'interim';
        } else if (message.transcriptType === 'final') {
          messageAnalysis.isFinal = true;
          messageAnalysis.messageType = 'final';
        } else if (message.isFinal === true || message.final === true) {
          messageAnalysis.isFinal = true;
          messageAnalysis.messageType = 'final';
        } else if (message.interim === true || message.isFinal === false) {
          messageAnalysis.isInterim = true;
          messageAnalysis.messageType = 'interim';
        }
        
        // Check for confidence scores
        if (message.confidence !== undefined) {
          messageAnalysis.confidence = message.confidence;
        }
        
        // Analyze content
        const content = message.content || message.message || message.text || message.transcript;
        if (content && content.trim().length > 0) {
          messageAnalysis.hasContent = true;
          messageAnalysis.contentLength = content.trim().length;
        }
        
        // Log message analysis
        console.log('=== MESSAGE TYPE ANALYSIS ===');
        console.log('Message Type:', messageAnalysis.messageType);
        console.log('Is Interim:', messageAnalysis.isInterim);
        console.log('Is Final:', messageAnalysis.isFinal);
        console.log('Confidence:', messageAnalysis.confidence);
        console.log('Has Content:', messageAnalysis.hasContent);
        console.log('Content Length:', messageAnalysis.contentLength);
        console.log('=== END TYPE ANALYSIS ===\n');
        
        // PHASE 1: Message sequence and timing analysis
        const currentTime = Date.now();
        const timeSinceLastMessage = currentTime - lastMessageTimeRef.current;
        
        // Store message in history for pattern analysis
        messageHistoryRef.current.push({
          ...message,
          receivedAt: currentTime,
          analysis: messageAnalysis
        });
        
        // Keep only last 10 messages for analysis
        if (messageHistoryRef.current.length > 10) {
          messageHistoryRef.current = messageHistoryRef.current.slice(-10);
        }
        
        // Analyze message patterns
        const patternAnalysis = {
          timeSinceLastMessage,
          isRapidSequence: timeSinceLastMessage < 1000, // Less than 1 second
          messageSequence: messageHistoryRef.current.length,
          sameSpeakerSequence: 0,
          contentProgression: false
        };
        
        // Check for same speaker sequence
        const lastMessages = messageHistoryRef.current.slice(-3);
        if (lastMessages.length > 1) {
          const currentRole = message.role || message.speaker || 'assistant';
          patternAnalysis.sameSpeakerSequence = lastMessages.filter(m => 
            (m.role || m.speaker || 'assistant') === currentRole
          ).length;
        }
        
        // Check for content progression (new message contains previous content)
        if (content && lastMessageRef.current) {
          patternAnalysis.contentProgression = content.includes(lastMessageRef.current) || 
                                            lastMessageRef.current.includes(content);
        }
        
        console.log('=== MESSAGE PATTERN ANALYSIS ===');
        console.log('Time since last message (ms):', patternAnalysis.timeSinceLastMessage);
        console.log('Is rapid sequence:', patternAnalysis.isRapidSequence);
        console.log('Message sequence length:', patternAnalysis.messageSequence);
        console.log('Same speaker sequence:', patternAnalysis.sameSpeakerSequence);
        console.log('Content progression detected:', patternAnalysis.contentProgression);
        console.log('Previous message content:', lastMessageRef.current);
        console.log('Current message content:', content);
        console.log('=== END PATTERN ANALYSIS ===\n');
        
        // Update timing reference
        lastMessageTimeRef.current = currentTime;
        
        // Extract content from various possible fields
        const role = message.role || message.speaker || 'assistant';
        const messageId = message.id || message.messageId;
        const timestamp = message.timestamp || message.createdAt || new Date().toISOString();
        
        // PHASE 1: Summary and decision logging
        console.log('=== MESSAGE PROCESSING DECISION ===');
        console.log('Will process this message:', {
          hasContent: !!content,
          contentLength: content ? content.trim().length : 0,
          isInterim: messageAnalysis.isInterim,
          isFinal: messageAnalysis.isFinal,
          isRapidSequence: patternAnalysis.isRapidSequence,
          contentProgression: patternAnalysis.contentProgression
        });
        console.log('=== END DECISION LOGGING ===\n');
        
        // PHASE 2: Message buffering and coalescing logic
        if (!content || content.trim().length < 3) {
          console.log('SKIPPING: No content or too short');
          return;
        }
        
        // Skip non-transcript messages (like status-update)
        if (message.type !== 'transcript') {
          console.log('SKIPPING: Non-transcript message type:', message.type);
          return;
        }
        
        // Create a unique key for this speaker's message sequence
        const speakerKey = `${role}-${messageAnalysis.messageType}`;
        
        // Convert VAPI message to our message format
        const vapiMessage: VapiMessage = {
          id: messageId || `vapi-${Date.now()}-${Math.random()}`,
          message: content,
          sender_type: role === 'user' ? 'respondent' : 'moderator',
          created_at: timestamp,
          metadata: {
            timestamp: timestamp,
            isVoice: true,
            vapiMessageId: messageId,
            transcriptType: message.transcriptType,
            isInterim: messageAnalysis.isInterim,
            isFinal: messageAnalysis.isFinal
          }
        };
        
        console.log('PHASE 2: Processing message:', {
          speakerKey,
          transcriptType: message.transcriptType,
          isInterim: messageAnalysis.isInterim,
          isFinal: messageAnalysis.isFinal,
          content: content.substring(0, 50) + '...'
        });
        
        // PHASE 3: Use speaker-based accumulation for all transcript messages
        if (messageAnalysis.isInterim) {
          // For interim messages, buffer and replace previous interim from same speaker
          console.log('BUFFERING: Interim message for speaker:', speakerKey);
          
          // Store in buffer
          messageBufferRef.current.set(speakerKey, vapiMessage);
          
          // Clear existing timeout
          if (bufferTimeoutRef.current) {
            clearTimeout(bufferTimeoutRef.current);
          }
          
          // Set timeout to process buffered message
          bufferTimeoutRef.current = setTimeout(() => {
            const bufferedMessage = messageBufferRef.current.get(speakerKey);
            if (bufferedMessage) {
              console.log('PROCESSING: Buffered interim message after timeout');
              processSpeakerMessage(bufferedMessage);
              messageBufferRef.current.delete(speakerKey);
            }
          }, 500); // 500ms delay for interim messages
          
        } else if (messageAnalysis.isFinal) {
          // For final messages, process immediately with speaker accumulation
          console.log('PROCESSING: Final message with speaker accumulation');
          
          // Clear any buffered interim message for this speaker
          if (messageBufferRef.current.has(speakerKey)) {
            console.log('CLEARING: Buffered interim message for final');
            messageBufferRef.current.delete(speakerKey);
          }
          
          // Clear timeout
          if (bufferTimeoutRef.current) {
            clearTimeout(bufferTimeoutRef.current);
            bufferTimeoutRef.current = null;
          }
          
          // Process final message with speaker accumulation
          processSpeakerMessage(vapiMessage);
          
        } else {
          // Unknown message type, use speaker accumulation
          console.log('PROCESSING: Unknown message type, using speaker accumulation');
          processSpeakerMessage(vapiMessage);
        }
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
  }, [updateVoiceSessionStatus, saveBatchMessages]);

  // Start interview function
  const startInterview = useCallback(async (respondentName?: string, discussionGuide?: string[], projectId?: string, humanRespondentId?: string) => {
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

      // Store project and respondent IDs for database persistence
      if (projectId) projectIdRef.current = projectId;
      if (humanRespondentId) humanRespondentIdRef.current = humanRespondentId;

      const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
      if (!assistantId) {
        throw new Error('Assistant ID not found');
      }

      // Format discussion guide as numbered list
      const formattedDiscussionGuide = discussionGuide && discussionGuide.length > 0 
        ? discussionGuide.map((item, index) => `${index + 1}. ${item}`).join('\n')
        : 'No specific discussion guide provided.';

      // Prepare assistant overrides with variables
      const assistantOverrides = {
        variableValues: {
          respondent_name: respondentName || 'the respondent',
          discussion_guide: formattedDiscussionGuide
        }
      };

      console.log('Starting VAPI interview with variables:', {
        respondent_name: respondentName || 'the respondent',
        discussion_guide_preview: formattedDiscussionGuide.substring(0, 100) + '...',
        project_id: projectId,
        human_respondent_id: humanRespondentId
      });

      // Create voice session in database
      await createVoiceSessionInDatabase();

      // Start the call with assistant overrides
      await vapiRef.current.start(assistantId, assistantOverrides);
      
    } catch (err) {
      console.error('Failed to start interview:', err);
      setError(err instanceof Error ? err.message : 'Failed to start voice interview');
      setIsCallActive(false);
    } finally {
      setIsLoading(false);
    }
  }, [initializeVapi, createVoiceSessionInDatabase]);

  // Stop interview function
  const stopInterview = useCallback(async () => {
    if (!vapiRef.current) {
      return;
    }

    try {
      setIsLoading(true);
      
      // Save any remaining messages in the queue
      if (messageQueueRef.current.length > 0) {
        await saveBatchMessages();
      }
      
      // Update voice session status to ended
      await updateVoiceSessionStatus('ended');
      
      await vapiRef.current.stop();
      setIsCallActive(false);
      
      // Clear session data
      voiceSessionIdRef.current = '';
      projectIdRef.current = '';
      humanRespondentIdRef.current = '';
      
    } catch (err) {
      console.error('Failed to stop interview:', err);
      setError(err instanceof Error ? err.message : 'Failed to stop voice interview');
    } finally {
      setIsLoading(false);
    }
  }, [saveBatchMessages, updateVoiceSessionStatus]);

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

  // PHASE 1: Debug function to export message analysis data
  const exportMessageAnalysis = useCallback(() => {
    const analysisData = {
      totalMessages: messageCountRef.current,
      messageHistory: messageHistoryRef.current,
      lastMessage: lastMessageRef.current,
      currentTranscript: transcript
    };
    
    console.log('=== EXPORTED MESSAGE ANALYSIS DATA ===');
    console.log(JSON.stringify(analysisData, null, 2));
    console.log('=== END EXPORTED DATA ===');
    
    return analysisData;
  }, [transcript]);

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
      
      // PHASE 2: Cleanup buffering state
      if (bufferTimeoutRef.current) {
        clearTimeout(bufferTimeoutRef.current);
        bufferTimeoutRef.current = null;
      }
      messageBufferRef.current.clear();
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
    clearTranscript,
    
    // PHASE 1: Debug functions
    exportMessageAnalysis
  };
}
