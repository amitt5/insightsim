-- Rollback migration for voice support in human_conversations table
-- This migration removes the voice-specific columns added in add_voice_support_to_human_conversations.sql

-- Drop indexes first
DROP INDEX IF EXISTS human_conversations_voice_metadata_idx;
DROP INDEX IF EXISTS human_conversations_voice_session_id_idx;
DROP INDEX IF EXISTS human_conversations_message_type_idx;

-- Drop columns
ALTER TABLE human_conversations DROP COLUMN IF EXISTS voice_metadata;
ALTER TABLE human_conversations DROP COLUMN IF EXISTS voice_session_id;
ALTER TABLE human_conversations DROP COLUMN IF EXISTS message_type;
