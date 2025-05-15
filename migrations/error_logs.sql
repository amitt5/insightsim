-- Create error_logs table
CREATE TABLE error_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  source VARCHAR(255) NOT NULL,
  error_message TEXT,
  response_string TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX error_logs_user_id_idx ON error_logs(user_id);
CREATE INDEX error_logs_source_idx ON error_logs(source);
CREATE INDEX error_logs_created_at_idx ON error_logs(created_at);

-- Add RLS policies
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Create policy - users can view their own error logs, admins all
CREATE POLICY "Users can view their own error logs"
  ON error_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy - all authenticated users can insert error logs
CREATE POLICY "Authenticated users can create error logs"
  ON error_logs FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Create policy - allow inserting logs with null user_id
CREATE POLICY "Allow anonymous error logs"
  ON error_logs FOR INSERT
  WITH CHECK (user_id IS NULL); 