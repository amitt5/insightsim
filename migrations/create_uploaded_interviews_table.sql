-- Create uploaded_interviews table for user-uploaded interview files
CREATE TABLE IF NOT EXISTS uploaded_interviews (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  filename text NOT NULL,
  original_filename text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  mime_type text NOT NULL,
  file_type text NOT NULL CHECK (file_type IN ('transcript', 'audio')),
  status text NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'processed', 'error')),
  transcript_text text,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for uploaded_interviews
CREATE INDEX IF NOT EXISTS uploaded_interviews_project_id_idx ON uploaded_interviews(project_id);
CREATE INDEX IF NOT EXISTS uploaded_interviews_user_id_idx ON uploaded_interviews(user_id);
CREATE INDEX IF NOT EXISTS uploaded_interviews_status_idx ON uploaded_interviews(status);
CREATE INDEX IF NOT EXISTS uploaded_interviews_file_type_idx ON uploaded_interviews(file_type);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_uploaded_interviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_uploaded_interviews_updated_at
  BEFORE UPDATE ON uploaded_interviews
  FOR EACH ROW
  EXECUTE FUNCTION update_uploaded_interviews_updated_at();

