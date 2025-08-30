-- Migration: Add RAG document support
-- Created: 2024-08-30
-- Description: Creates simulation_documents table and adds rag_documents_url column to simulations table

-- Create simulation_documents table
CREATE TABLE simulation_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  simulation_id UUID NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_simulation_documents_simulation_id ON simulation_documents(simulation_id);
CREATE INDEX idx_simulation_documents_created_at ON simulation_documents(created_at);

-- Add rag_documents_url column to simulations table
ALTER TABLE simulations 
ADD COLUMN rag_documents_url TEXT[];
