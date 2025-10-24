// Utility functions for voice message API operations
import { SaveMessageRequest, BatchSaveMessagesRequest, VoiceMetadata } from '@/types/database';

/**
 * Save a single voice message to the database
 */
export async function saveVoiceMessage(messageData: SaveMessageRequest): Promise<any> {
  try {
    const response = await fetch('/api/public/human-conversations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messageData),
    });

    if (!response.ok) {
      throw new Error(`Failed to save voice message: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving voice message:', error);
    throw error;
  }
}

/**
 * Save multiple voice messages in a batch for efficiency
 */
export async function saveVoiceMessageBatch(messages: SaveMessageRequest[]): Promise<any> {
  try {
    const batchData: BatchSaveMessagesRequest = { messages };
    
    const response = await fetch('/api/public/human-conversations/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batchData),
    });

    if (!response.ok) {
      throw new Error(`Failed to save voice message batch: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving voice message batch:', error);
    throw error;
  }
}

/**
 * Create a new voice session
 */
export async function createVoiceSession(sessionData: {
  project_id: string;
  human_respondent_id: string;
  vapi_call_id?: string;
  assistant_id?: string;
  metadata?: Record<string, any>;
}): Promise<any> {
  try {
    const response = await fetch('/api/public/voice-sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sessionData),
    });

    if (!response.ok) {
      throw new Error(`Failed to create voice session: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating voice session:', error);
    throw error;
  }
}

/**
 * Update voice session status
 */
export async function updateVoiceSession(sessionId: string, updates: {
  status: 'started' | 'in_progress' | 'ended' | 'failed';
  ended_at?: string;
  metadata?: Record<string, any>;
}): Promise<any> {
  try {
    const response = await fetch('/api/public/voice-sessions', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: sessionId,
        ...updates
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update voice session: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating voice session:', error);
    throw error;
  }
}

/**
 * Get voice sessions for a respondent
 */
export async function getVoiceSessions(params: {
  project_id: string;
  human_respondent_id: string;
  status?: string;
}): Promise<any> {
  try {
    const searchParams = new URLSearchParams({
      project_id: params.project_id,
      human_respondent_id: params.human_respondent_id,
    });

    if (params.status) {
      searchParams.append('status', params.status);
    }

    const response = await fetch(`/api/public/voice-sessions?${searchParams}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch voice sessions: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching voice sessions:', error);
    throw error;
  }
}

/**
 * Helper function to create voice message data from VAPI message
 */
export function createVoiceMessageData(
  vapiMessage: any,
  projectId: string,
  humanRespondentId: string,
  voiceSessionId?: string
): SaveMessageRequest {
  // Extract message content
  const message = vapiMessage.transcript || vapiMessage.content || vapiMessage.message || '';
  
  // Determine sender type based on role
  const sender_type = vapiMessage.role === 'assistant' ? 'moderator' : 'respondent';
  
  // Create voice metadata
  const voice_metadata: VoiceMetadata = {
    transcriptType: vapiMessage.transcriptType,
    isInterim: vapiMessage.transcriptType === 'partial',
    isFinal: vapiMessage.transcriptType === 'final',
    vapiMessageId: vapiMessage.id,
    rawMessage: vapiMessage,
    confidence: vapiMessage.confidence,
    timestamp: new Date().toISOString()
  };

  return {
    project_id: projectId,
    human_respondent_id: humanRespondentId,
    message,
    sender_type,
    message_type: 'voice',
    voice_session_id: voiceSessionId,
    voice_metadata
  };
}

/**
 * Helper function to generate a unique voice session ID
 * Returns a proper UUID v4 format
 */
export function generateVoiceSessionId(): string {
  return crypto.randomUUID();
}
