-- Refactor: Move context storage from simulations to simulation_documents table
-- This allows per-document context storage for better flexibility and performance

-- Add context columns to simulation_documents table
ALTER TABLE simulation_documents 
ADD COLUMN context_string TEXT;

ALTER TABLE simulation_documents 
ADD COLUMN context_processed_at TIMESTAMP WITH TIME ZONE;

-- Add index for performance on context queries
CREATE INDEX idx_simulation_documents_context_processed_at ON simulation_documents(context_processed_at);

-- Add comments for documentation
COMMENT ON COLUMN simulation_documents.context_string IS 'Processed text content extracted from this document for Context Augmented Generation';
COMMENT ON COLUMN simulation_documents.context_processed_at IS 'Timestamp when the context_string was extracted from this document';

-- Remove context columns from simulations table (cleanup from previous approach)
ALTER TABLE simulations 
DROP COLUMN IF EXISTS context_string;

ALTER TABLE simulations 
DROP COLUMN IF EXISTS context_processed_at;

-- Drop the index we created earlier
DROP INDEX IF EXISTS idx_simulations_context_processed_at;
