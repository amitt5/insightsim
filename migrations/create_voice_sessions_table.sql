-- Create voice_sessions table for tracking voice interview sessions
-- This table stores metadata about voice interview sessions

CREATE TABLE voice_sessions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id uuid REFERENCES projects(id) NOT NULL,
  human_respondent_id uuid REFERENCES human_respondents(id) NOT NULL,
  status text NOT NULL DEFAULT 'started' CHECK (status IN ('started', 'in_progress', 'ended', 'failed')),
  started_at timestamp with time zone NOT NULL,
  ended_at timestamp with time zone,
  vapi_call_id text,
  assistant_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for performance
CREATE INDEX voice_sessions_project_id_idx ON voice_sessions(project_id);
CREATE INDEX voice_sessions_human_respondent_id_idx ON voice_sessions(human_respondent_id);
CREATE INDEX voice_sessions_status_idx ON voice_sessions(status);
CREATE INDEX voice_sessions_vapi_call_id_idx ON voice_sessions(vapi_call_id);
CREATE INDEX voice_sessions_metadata_idx ON voice_sessions USING GIN (metadata);

-- Add comments to document the table
COMMENT ON TABLE voice_sessions IS 'Tracks voice interview sessions and their metadata';
COMMENT ON COLUMN voice_sessions.status IS 'Current status of the voice session';
COMMENT ON COLUMN voice_sessions.vapi_call_id IS 'VAPI call ID for tracking the voice session';
COMMENT ON COLUMN voice_sessions.assistant_id IS 'VAPI assistant ID used for the session';
COMMENT ON COLUMN voice_sessions.metadata IS 'Additional session metadata and configuration';
