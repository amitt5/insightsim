-- Migration: Add fields to rag_documents table to support transcript uploads
-- This migration adds fields to track which simulation or interview a transcript belongs to

-- Add simulation_id column to reference simulations table
ALTER TABLE rag_documents 
ADD COLUMN simulation_id UUID REFERENCES simulations(id) ON DELETE CASCADE;

-- Add respondent_id column to reference human_respondents table  
ALTER TABLE rag_documents 
ADD COLUMN respondent_id UUID REFERENCES human_respondents(id) ON DELETE CASCADE;

-- Add transcript_type column to distinguish between synthetic and human transcripts
ALTER TABLE rag_documents 
ADD COLUMN transcript_type VARCHAR(20) CHECK (transcript_type IN ('synthetic', 'human'));

-- Add indexes for faster lookups
CREATE INDEX idx_rag_documents_simulation_id ON rag_documents(simulation_id);
CREATE INDEX idx_rag_documents_respondent_id ON rag_documents(respondent_id);
CREATE INDEX idx_rag_documents_transcript_type ON rag_documents(transcript_type);

-- Add composite index for checking duplicates
CREATE INDEX idx_rag_documents_transcript_lookup ON rag_documents(simulation_id, respondent_id, transcript_type, status) 
WHERE transcript_type IS NOT NULL;

-- Add comment to document the new columns
COMMENT ON COLUMN rag_documents.simulation_id IS 'Reference to simulation for synthetic transcripts';
COMMENT ON COLUMN rag_documents.respondent_id IS 'Reference to human respondent/interview for human transcripts';
COMMENT ON COLUMN rag_documents.transcript_type IS 'Type of transcript: synthetic or human';

