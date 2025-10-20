-- Migration: Add CAG (Context-Aware Generation) fields to rag_documents table
-- This migration adds fields to support full-text storage for CAG approach

-- Add full_text column to store the complete extracted text
ALTER TABLE rag_documents 
ADD COLUMN full_text TEXT;

-- Add text_length column to store the character count of extracted text
ALTER TABLE rag_documents 
ADD COLUMN text_length INTEGER;

-- Add pages_count column to store the number of pages in the document
ALTER TABLE rag_documents 
ADD COLUMN pages_count INTEGER;

-- Add processing_method column to track how the document was processed
ALTER TABLE rag_documents 
ADD COLUMN processing_method VARCHAR(50) DEFAULT 'chunked';

-- Add index on processing_method for efficient querying
CREATE INDEX idx_rag_documents_processing_method ON rag_documents(processing_method);

-- Add index on text_length for potential filtering/sorting
CREATE INDEX idx_rag_documents_text_length ON rag_documents(text_length);

-- Optional: Add a check constraint to ensure processing_method has valid values
ALTER TABLE rag_documents 
ADD CONSTRAINT chk_processing_method 
CHECK (processing_method IN ('chunked', 'cag_extract_only', 'hybrid'));

-- Update existing records to have default processing_method
UPDATE rag_documents 
SET processing_method = 'chunked' 
WHERE processing_method IS NULL;

-- Add comment to document the new columns
COMMENT ON COLUMN rag_documents.full_text IS 'Complete extracted text for CAG approach';
COMMENT ON COLUMN rag_documents.text_length IS 'Character count of extracted text';
COMMENT ON COLUMN rag_documents.pages_count IS 'Number of pages in the original document';
COMMENT ON COLUMN rag_documents.processing_method IS 'Method used to process the document: chunked, cag_extract_only, or hybrid';
