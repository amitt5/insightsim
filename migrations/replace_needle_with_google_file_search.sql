-- Migration: Replace Needle API fields with Google File Search API fields
-- This migration removes Needle integration fields and adds Google File Search fields

-- Step 1: Remove Needle fields from projects table
ALTER TABLE projects 
DROP COLUMN IF EXISTS needle_collection_id;

DROP INDEX IF EXISTS idx_projects_needle_collection_id;

-- Step 2: Remove Needle fields from rag_documents table
ALTER TABLE rag_documents 
DROP COLUMN IF EXISTS needle_collection_id;

ALTER TABLE rag_documents 
DROP COLUMN IF EXISTS needle_file_id;

DROP INDEX IF EXISTS idx_rag_documents_needle_collection_id;
DROP INDEX IF EXISTS idx_rag_documents_needle_file_id;

-- Step 3: Add Google File Search fields to projects table
ALTER TABLE projects 
ADD COLUMN google_file_search_store_id TEXT;

-- Add index for efficient lookup
CREATE INDEX idx_projects_google_file_search_store_id ON projects(google_file_search_store_id);

-- Add comment to document the field
COMMENT ON COLUMN projects.google_file_search_store_id IS 'Google File Search Store ID for this project. One store per project.';

-- Step 4: Add Google File Search fields to rag_documents table
ALTER TABLE rag_documents 
ADD COLUMN google_file_name TEXT;

-- Add index for efficient lookup
CREATE INDEX idx_rag_documents_google_file_name ON rag_documents(google_file_name);

-- Add comment to document the field
COMMENT ON COLUMN rag_documents.google_file_name IS 'Google File API file name (for reference after upload to File Search Store)';

-- Step 5: Make file_path nullable (files are now stored in Google File Search, not Supabase)
ALTER TABLE rag_documents 
ALTER COLUMN file_path DROP NOT NULL;

-- Step 6: Update processing_method constraint
-- Drop the existing constraint
ALTER TABLE rag_documents 
DROP CONSTRAINT IF EXISTS chk_processing_method;

-- Add the updated constraint with 'google_file_search' option (removing 'needle')
ALTER TABLE rag_documents 
ADD CONSTRAINT chk_processing_method 
CHECK (processing_method IN ('chunked', 'cag_extract_only', 'hybrid', 'google_file_search'));

