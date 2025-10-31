-- Add persona_id column to rag_documents table
ALTER TABLE rag_documents
ADD COLUMN persona_id UUID REFERENCES personas(id) ON DELETE CASCADE;

-- Make project_id nullable (since documents can be linked to either project or persona)
ALTER TABLE rag_documents
ALTER COLUMN project_id DROP NOT NULL;

-- Create index for faster lookups by persona_id
CREATE INDEX idx_rag_documents_persona_id ON rag_documents(persona_id);

-- Add check constraint to ensure at least one of project_id or persona_id is set
ALTER TABLE rag_documents
ADD CONSTRAINT rag_documents_project_or_persona_check
CHECK (project_id IS NOT NULL OR persona_id IS NOT NULL);

