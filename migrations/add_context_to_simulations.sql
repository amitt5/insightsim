-- Add context columns to simulations table for CAG (Context Augmented Generation)

-- Add context_string column to store processed document content
ALTER TABLE simulations 
ADD COLUMN context_string TEXT;

-- Add context_processed_at column to track when context was last generated
ALTER TABLE simulations 
ADD COLUMN context_processed_at TIMESTAMP WITH TIME ZONE;

-- Add index for performance on context_processed_at queries
CREATE INDEX idx_simulations_context_processed_at ON simulations(context_processed_at);

-- Add comment for documentation
COMMENT ON COLUMN simulations.context_string IS 'Concatenated and processed text content from all uploaded documents for Context Augmented Generation';
COMMENT ON COLUMN simulations.context_processed_at IS 'Timestamp when the context_string was last generated from uploaded documents';