-- Enable pgvector extension for vector storage
CREATE EXTENSION IF NOT EXISTS vector;

-- Grant necessary permissions for vector operations
GRANT USAGE ON SCHEMA public TO postgres;
GRANT CREATE ON SCHEMA public TO postgres;

-- Note: The SupabaseVectorStore will automatically create collection tables
-- when you first run the RAG service. Each simulation gets its own collection:
-- Example: simulation_abc123def456 -> collection table

-- You can verify vector tables are created by running:
-- SELECT tablename FROM pg_tables WHERE tablename LIKE 'vecs_%';

-- Optional: Check if pgvector is working
-- SELECT * FROM pg_extension WHERE extname = 'vector';

-- Vector operations will create tables with this pattern:
-- CREATE TABLE IF NOT EXISTS vecs.simulation_[simulation_id] (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   vec vector(1536),  -- OpenAI embedding dimension
--   metadata JSONB
-- );

COMMENT ON EXTENSION vector IS 'Vector similarity search for RAG embeddings'; 