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
import { processMessageInSequence, ProcessedMessage } from '@/utils/messageProcessor';
import { ConversationTranscript, ConversationTurn } from '@/types/conversation';

// Message interface compatible with existing InterviewPage component
export interface VapiMessage extends ProcessedMessage {}

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
  clearVoiceSession: () => void;
  
  // Callback functions
  onCallEnd: (callback: () => void) => void;
  onRawMessage: (callback: (message: any) => void) => void;
  
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
  
  // Callback management
  const callEndCallbackRef = useRef<(() => void) | null>(null);
  // Prevent duplicate end handling
  const isEndingRef = useRef<boolean>(false);
  // Raw message tap for consumers
  const rawMessageCallbackRef = useRef<((message: any) => void) | null>(null);
  // Latest conversation transcript from conversation-update events
  const latestConversationRef = useRef<ConversationTranscript>([]);

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
      // console.log('✅ Batch saved', messagesToSave.length, 'messages to database');
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
    //console.log('Processing buffered message:', message.message.substring(0, 50) + '...');
    
    setTranscript(prev => {
      // Find and replace the last interim message from this speaker, or add new one
      const speakerType = message.sender_type;
      const lastMessageIndex = prev.findLastIndex(m => m.sender_type === speakerType);
      
      if (lastMessageIndex >= 0 && prev[lastMessageIndex].metadata?.isInterim) {
        // Replace the last interim message
        const updated = [...prev];
        updated[lastMessageIndex] = message;
        //console.log('REPLACED: Interim message at index', lastMessageIndex);
        return updated;
      } else {
        // Add as new message
        //console.log('ADDED: New buffered message');
        return [...prev, message];
      }
    });
  }, []);

  const processFinalMessage = useCallback((message: VapiMessage) => {
    //console.log('Processing final message:', message.message.substring(0, 50) + '...');
    
    setTranscript(prev => {
      const speakerType = message.sender_type;
      const lastMessageIndex = prev.findLastIndex(m => m.sender_type === speakerType);
      
      if (lastMessageIndex >= 0 && prev[lastMessageIndex].metadata?.isInterim) {
        // Replace the last interim message with final
        const updated = [...prev];
        updated[lastMessageIndex] = message;
        //console.log('REPLACED: Interim with final message at index', lastMessageIndex);
        return updated;
      } else {
        // Add as new message
        //console.log('ADDED: New final message');
        return [...prev, message];
      }
    });
  }, []);

  const processLegacyMessage = useCallback((message: VapiMessage) => {
    //console.log('Processing legacy message:', message.message.substring(0, 50) + '...');
    
    setTranscript(prev => {
      // Check for duplicates
      const isDuplicate = prev.some(existing => 
        existing.message === message.message && 
        existing.sender_type === message.sender_type &&
        Math.abs(new Date(existing.created_at).getTime() - new Date(message.created_at).getTime()) < 5000
      );
      
      if (isDuplicate) {
        //console.log('SKIPPED: Duplicate legacy message');
        return prev;
      }
      
      //console.log('ADDED: New legacy message');
      return [...prev, message];
    });
  }, []);

  // PHASE 3: Speaker-based message accumulation using utility function
  const processSpeakerMessage = useCallback((message: VapiMessage) => {
    const currentSpeaker = currentSpeakerRef.current;
    
    // console.log('PHASE 3: Processing speaker message:', {
    //   speakerType: message.sender_type,
    //   currentSpeaker,
    //   message: message.message.substring(0, 50) + '...'
    // });
    
    setTranscript(prev => {
      const result = processMessageInSequence(message, prev, currentSpeaker);
      
      // Update speaker tracking
      currentSpeakerRef.current = result.newCurrentSpeaker;
      
      // Update current speaker message reference
      if (result.updatedMessages.length > 0) {
        const lastMessage = result.updatedMessages[result.updatedMessages.length - 1];
        if (lastMessage.sender_type === result.newCurrentSpeaker) {
          currentSpeakerMessageRef.current = lastMessage;
        }
      }
      
      //console.log('PROCESSED: Updated messages count:', result.updatedMessages.length);
      return result.updatedMessages;
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
      //console.log('✅ Message saved to database:', message.message.substring(0, 50) + '...');
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
      // Clear any existing session ID first
      voiceSessionIdRef.current = '';

      const sessionData = await createVoiceSession({
        project_id: projectIdRef.current,
        human_respondent_id: humanRespondentIdRef.current,
        vapi_call_id: `vapi_call_${Date.now()}`,
        assistant_id: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID,
        metadata: {
          created_by: 'useVapi_hook',
          timestamp: new Date().toISOString()
        }
      });

      // Use the actual session ID returned from the API
      if (sessionData && sessionData.id) {
        voiceSessionIdRef.current = sessionData.id;
        //console.log('✅ Voice session created:', sessionData.id);
      } else {
        throw new Error('No session ID returned from API');
      }
    } catch (error) {
      console.error('❌ Failed to create voice session:', error);
      // Clear the session ID if creation failed
      voiceSessionIdRef.current = '';
      throw error;
    }
  }, []);

  const updateVoiceSessionStatus = useCallback(async (status: 'started' | 'in_progress' | 'ended' | 'failed') => {
    if (!voiceSessionIdRef.current) {
      console.warn('Cannot update voice session status: no session ID available');
      return;
    }

    try {
      await updateVoiceSession(voiceSessionIdRef.current, {
        status,
        ended_at: status === 'ended' ? new Date().toISOString() : undefined
      });
      //console.log('✅ Voice session status updated:', status);
    } catch (error) {
      console.error('❌ Failed to update voice session status:', error);
      // If the session doesn't exist, clear the session ID to prevent further attempts
      if (error instanceof Error && error.message.includes('not found')) {
        console.warn('Clearing invalid session ID');
        voiceSessionIdRef.current = '';
      }
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
      console.log('apiKey', apiKey);
      console.log('assistantId', assistantId);
      if (!apiKey || !assistantId) {
        throw new Error('VAPI API key or Assistant ID not found in environment variables');
      }

      // Initialize VAPI client
      const vapi = new Vapi(apiKey);
      vapiRef.current = vapi;
      isInitializedRef.current = true;

      // Set up event listeners
      vapi.on('call-start', () => {
        //console.log('VAPI call started');
        setIsCallActive(true);
        setError(null);
        isEndingRef.current = false;
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
        if (isEndingRef.current) {
          return; // already handled
        }
        isEndingRef.current = true;
        //console.log('VAPI call ended');
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
        
        // Save full conversation transcript on call end (fire-and-forget)
        try {
          if (latestConversationRef.current && latestConversationRef.current.length > 0 && humanRespondentIdRef.current) {
            fetch(`/api/public/human-respondents/${humanRespondentIdRef.current}/conversation`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ conversation: latestConversationRef.current })
            }).catch(() => {});
          }
        } catch (e) {
          console.warn('Failed to trigger conversation save on end', e);
        }
        updateVoiceSessionStatus('ended');
        
        // Trigger call end callback if set
        if (callEndCallbackRef.current) {
          callEndCallbackRef.current();
        }
      });

      vapi.on('message', (message: any) => {
        messageCountRef.current += 1;
        
        // PHASE 1: Comprehensive message analysis and logging
        //console.log(`\n=== VAPI MESSAGE #${messageCountRef.current} ===`);
        console.debug('Raw message object:', message);

        // Expose raw message to consumer callback (if registered)
        if (rawMessageCallbackRef.current && message.type === 'conversation-update') {
          try {
            rawMessageCallbackRef.current(message);
          } catch (err) {
            console.error('Error in onRawMessage callback:', err);
          }
        }

        // Capture and map latest conversation transcript
        if (message?.type === 'conversation-update' && Array.isArray(message?.conversation)) {
          try {
            const mapped: ConversationTranscript = (message.conversation as any[])
              .map((t) => ({
                role: t?.role,
                content: t?.content,
              }))
              .filter((t: ConversationTurn) => !!t && !!t.content && !!t.role);
            latestConversationRef.current = mapped;
          } catch (e) {
            console.warn('Failed to map conversation-update payload', e);
          }
        }

        // console.log('Message type:', typeof message);
        // console.log('Message keys:', Object.keys(message));
        
        // // Log all possible fields we might need
        // console.log('=== MESSAGE FIELD ANALYSIS ===');
        // console.log('id:', message.id);
        // console.log('messageId:', message.messageId);
        // console.log('type:', message.type);
        // console.log('role:', message.role);
        // console.log('speaker:', message.speaker);
        // console.log('content:', message.content);
        // console.log('message:', message.message);
        // console.log('text:', message.text);
        // console.log('transcript:', message.transcript);
        // console.log('timestamp:', message.timestamp);
        // console.log('createdAt:', message.createdAt);
        // console.log('confidence:', message.confidence);
        // console.log('isFinal:', message.isFinal);
        // console.log('final:', message.final);
        // console.log('interim:', message.interim);
        // console.log('status:', message.status);
        // console.log('sequence:', message.sequence);
        // console.log('duration:', message.duration);
        // console.log('startTime:', message.startTime);
        // console.log('endTime:', message.endTime);
        
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
        
        //console.log('=== END MESSAGE ANALYSIS ===\n');
        
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
        //console.log('=== MESSAGE TYPE ANALYSIS ===');
        //console.log('Message Type:', messageAnalysis.messageType);
        //console.log('Is Interim:', messageAnalysis.isInterim);
        //console.log('Is Final:', messageAnalysis.isFinal);
        //console.log('Confidence:', messageAnalysis.confidence);
        //console.log('Has Content:', messageAnalysis.hasContent);
        //console.log('Content Length:', messageAnalysis.contentLength);
        //console.log('=== END TYPE ANALYSIS ===\n');
        
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
        
        //console.log('=== MESSAGE PATTERN ANALYSIS ===');
        //console.log('Time since last message (ms):', patternAnalysis.timeSinceLastMessage);
        //console.log('Is rapid sequence:', patternAnalysis.isRapidSequence);
        //console.log('Message sequence length:', patternAnalysis.messageSequence);
        //console.log('Same speaker sequence:', patternAnalysis.sameSpeakerSequence);
        //console.log('Content progression detected:', patternAnalysis.contentProgression);
        //console.log('Previous message content:', lastMessageRef.current);
        //console.log('Current message content:', content);
        //console.log('=== END PATTERN ANALYSIS ===\n');
        
        // Update timing reference
        lastMessageTimeRef.current = currentTime;
        
        // Extract content from various possible fields
        const role = message.role || message.speaker || 'assistant';
        const messageId = message.id || message.messageId;
        const timestamp = message.timestamp || message.createdAt || new Date().toISOString();
        
        // PHASE 1: Summary and decision logging
        //console.log('=== MESSAGE PROCESSING DECISION ===');
        //console.log('Will process this message:', {
          // hasContent: !!content,
        //   contentLength: content ? content.trim().length : 0,
        //   isInterim: messageAnalysis.isInterim,
        //   isFinal: messageAnalysis.isFinal,
        //   isRapidSequence: patternAnalysis.isRapidSequence,
        //   contentProgression: patternAnalysis.contentProgression
        // });
        //console.log('=== END DECISION LOGGING ===\n');
        
        // PHASE 2: Message buffering and coalescing logic
        if (!content || content.trim().length < 3) {
          // console.log('SKIPPING: No content or too short');
          return;
        }
        
        // Skip non-transcript messages (like status-update)
        if (message.type !== 'transcript') {
          // console.log('SKIPPING: Non-transcript message type:', message.type);
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
        
        //console.log('PHASE 2: Processing message:', {
        //   speakerKey,
        //   transcriptType: message.transcriptType,
        //   isInterim: messageAnalysis.isInterim,
        //   isFinal: messageAnalysis.isFinal,
        //   content: content.substring(0, 50) + '...'
        // });
        
        // PHASE 3: Use speaker-based accumulation for all transcript messages
        if (messageAnalysis.isInterim) {
          // For interim messages, buffer and replace previous interim from same speaker
          // console.log('BUFFERING: Interim message for speaker:', speakerKey);
          
          // Clear any buffered interim message for this speaker
          if (messageBufferRef.current.has(speakerKey)) {
            console.log('CLEARING: Previous buffered interim message');
            messageBufferRef.current.delete(speakerKey);
          }
          
          // Clear timeout
          if (bufferTimeoutRef.current) {
            clearTimeout(bufferTimeoutRef.current);
          }
          
          // Set timeout to process buffered message
          bufferTimeoutRef.current = setTimeout(() => {
            const bufferedMessage = messageBufferRef.current.get(speakerKey);
            if (bufferedMessage) {
              // console.log('PROCESSING: Buffered interim message after timeout');
              processSpeakerMessage(bufferedMessage);
              messageBufferRef.current.delete(speakerKey);
            }
          }, 500); // 500ms delay for interim messages
          
        } else if (messageAnalysis.isFinal) {
          // For final messages, process immediately with speaker accumulation
          // console.log('PROCESSING: Final message with speaker accumulation');
          
          // Clear any buffered interim message for this speaker
          if (messageBufferRef.current.has(speakerKey)) {
            // console.log('CLEARING: Buffered interim message for final');
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
          // console.log('PROCESSING: Unknown message type, using speaker accumulation');
          processSpeakerMessage(vapiMessage);
        }
      });

      vapi.on('error', (error: VapiErrorEvent) => {
        // Normalize potential fields from Daily/Vapi
        const message = (error as any)?.message || (error as any)?.error || '';
        const errorMsg = (error as any)?.errorMsg;
        const nestedMsg = (error as any)?.error?.msg || (error as any)?.error?.message;

        // Explicit handling: treat Daily's meeting-end as normal
        const isExplicitMeetingEnded = errorMsg === 'Meeting has ended' || nestedMsg === 'Meeting has ended';

        // Generic benign end detection (covers variations like ejection)
        const isBenignEnd = /ejection|meeting has ended|meeting ended/i.test(String(message));
        const isEmptyAfterEnd = !message && isEndingRef.current;

        if (isExplicitMeetingEnded || isBenignEnd || isEmptyAfterEnd) {
          console.info('Call ended normally');
          return; // ignore benign end-of-call errors
        }

        console.error('VAPI error:', error);
        setError((message as string) || 'An error occurred with the voice service');
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

      // console.log('Starting VAPI interview with variables:', {
      //   respondent_name: respondentName || 'the respondent',
      //   discussion_guide_preview: formattedDiscussionGuide.substring(0, 100) + '...',
      //   project_id: projectId,
      //   human_respondent_id: humanRespondentId
      // });

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

  const clearVoiceSession = useCallback(() => {
    voiceSessionIdRef.current = '';
    projectIdRef.current = '';
    humanRespondentIdRef.current = '';
    console.log('✅ Voice session state cleared');
  }, []);

  // Callback functions
  const onCallEnd = useCallback((callback: () => void) => {
    callEndCallbackRef.current = callback;
  }, []);

  const onRawMessage = useCallback((callback: (message: any) => void) => {
    rawMessageCallbackRef.current = callback;
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
    clearVoiceSession,
    
    // Callback functions
    onCallEnd,
    onRawMessage,
    
    // PHASE 1: Debug functions
    exportMessageAnalysis
  };
}
