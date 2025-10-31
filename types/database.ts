// Database type definitions for InsightSim
// This file contains TypeScript interfaces for our database schema

export interface HumanConversation {
  id: string;
  project_id: string;
  human_respondent_id: string;
  sender_type: 'moderator' | 'respondent';
  message: string;
  message_order: number;
  created_at: string;
  metadata: Record<string, any>;
  
  // New voice-specific fields (added in Phase 1)
  message_type: 'text' | 'voice';
  voice_session_id?: string;
  voice_metadata: VoiceMetadata;
}

export interface VoiceMetadata {
  // VAPI-specific metadata
  transcriptType?: 'partial' | 'final';
  isInterim?: boolean;
  isFinal?: boolean;
  isAccumulated?: boolean;
  lastUpdate?: string;
  
  // VAPI message details
  vapiMessageId?: string;
  rawMessage?: any;
  
  // Voice session details
  sessionStartTime?: string;
  sessionEndTime?: string;
  assistantId?: string;
  
  // Audio/transcript quality metrics
  confidence?: number;
  duration?: number;
  
  // Custom fields for future use
  [key: string]: any;
}

export interface VoiceSession {
  id: string;
  project_id: string;
  human_respondent_id: string;
  status: 'started' | 'in_progress' | 'ended' | 'failed';
  started_at: string;
  ended_at?: string;
  vapi_call_id?: string;
  assistant_id?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// API request/response types
export interface SaveMessageRequest {
  project_id: string;
  human_respondent_id: string;
  message: string;
  sender_type: 'moderator' | 'respondent';
  message_type?: 'text' | 'voice';
  voice_session_id?: string;
  voice_metadata?: VoiceMetadata;
}

export interface SaveMessageResponse {
  id: string;
  message_order: number;
  created_at: string;
}

export interface BatchSaveMessagesRequest {
  messages: SaveMessageRequest[];
}

export interface BatchSaveMessagesResponse {
  saved_count: number;
  failed_count: number;
  errors?: string[];
}
