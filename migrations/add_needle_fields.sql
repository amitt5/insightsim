    -- Migration: Add Needle API integration fields
    -- This migration adds fields to support Needle API integration for RAG documents

    -- Step 1: Add needle_collection_id to projects table
    -- This stores the Needle collection ID for each project (one collection per project)
    ALTER TABLE projects 
    ADD COLUMN needle_collection_id TEXT;

    -- Add index for efficient lookup
    CREATE INDEX idx_projects_needle_collection_id ON projects(needle_collection_id);

    -- Add comment to document the field
    COMMENT ON COLUMN projects.needle_collection_id IS 'Needle API collection ID for this project. One collection per project.';

    -- Step 2: Add Needle fields to rag_documents table
    ALTER TABLE rag_documents 
    ADD COLUMN needle_collection_id TEXT;

    ALTER TABLE rag_documents 
    ADD COLUMN needle_file_id TEXT;

    -- Add indexes for efficient lookups
    CREATE INDEX idx_rag_documents_needle_collection_id ON rag_documents(needle_collection_id);
    CREATE INDEX idx_rag_documents_needle_file_id ON rag_documents(needle_file_id);

    -- Add comments to document the fields
    COMMENT ON COLUMN rag_documents.needle_collection_id IS 'Needle API collection ID (for reference, matches project needle_collection_id)';
    COMMENT ON COLUMN rag_documents.needle_file_id IS 'Needle API file ID after upload';

    -- Step 3: Update processing_method constraint to include 'needle'
    -- First, drop the existing constraint
    ALTER TABLE rag_documents 
    DROP CONSTRAINT IF EXISTS chk_processing_method;

    -- Add the updated constraint with 'needle' option
    ALTER TABLE rag_documents 
    ADD CONSTRAINT chk_processing_method 
    CHECK (processing_method IN ('chunked', 'cag_extract_only', 'hybrid', 'needle'));

