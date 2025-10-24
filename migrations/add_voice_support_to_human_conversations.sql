-- Add voice message support to human_conversations table
-- This migration adds fields to support VAPI voice transcripts while maintaining backward compatibility

-- Add message_type column to distinguish between text and voice messages
ALTER TABLE human_conversations 
ADD COLUMN message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'voice'));

-- Add voice_session_id column to group voice messages by session
ALTER TABLE human_conversations 
ADD COLUMN voice_session_id uuid;

-- Add voice_metadata column to store VAPI-specific data
ALTER TABLE human_conversations 
ADD COLUMN voice_metadata jsonb DEFAULT '{}'::jsonb;

-- Add indexes for performance
CREATE INDEX human_conversations_message_type_idx ON human_conversations(message_type);
CREATE INDEX human_conversations_voice_session_id_idx ON human_conversations(voice_session_id);
CREATE INDEX human_conversations_voice_metadata_idx ON human_conversations USING GIN (voice_metadata);

-- Add comment to document the new columns
COMMENT ON COLUMN human_conversations.message_type IS 'Type of message: text (default) or voice';
COMMENT ON COLUMN human_conversations.voice_session_id IS 'UUID to group voice messages by interview session';
COMMENT ON COLUMN human_conversations.voice_metadata IS 'JSONB field for VAPI-specific metadata (transcriptType, confidence, etc.)';
