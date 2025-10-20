-- Create rag_document_chunks table
CREATE TABLE rag_document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES rag_documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    chunk_text TEXT NOT NULL,
    chunk_embedding VECTOR(1536), -- OpenAI ada-002 embedding dimension
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups and vector similarity search
CREATE INDEX idx_rag_document_chunks_document_id ON rag_document_chunks(document_id);
CREATE INDEX idx_rag_document_chunks_chunk_index ON rag_document_chunks(document_id, chunk_index);
CREATE INDEX idx_rag_document_chunks_created_at ON rag_document_chunks(created_at);

-- Create vector similarity search index (using pgvector extension)
-- Note: This requires the pgvector extension to be installed
-- CREATE INDEX idx_rag_document_chunks_embedding ON rag_document_chunks 
-- USING ivfflat (chunk_embedding vector_cosine_ops) WITH (lists = 100);

-- Add constraint to ensure chunk_index is unique per document
ALTER TABLE rag_document_chunks 
ADD CONSTRAINT unique_chunk_per_document 
UNIQUE (document_id, chunk_index);

-- Add constraint to ensure chunk_index is non-negative
ALTER TABLE rag_document_chunks 
ADD CONSTRAINT positive_chunk_index 
CHECK (chunk_index >= 0);
