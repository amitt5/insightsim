-- Create RPC function for vector similarity search
-- This function performs efficient vector similarity search using pgvector

CREATE OR REPLACE FUNCTION search_rag_chunks(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  project_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  chunk_index int,
  chunk_text text,
  metadata jsonb,
  similarity float,
  distance float,
  original_filename text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.document_id,
    c.chunk_index,
    c.chunk_text,
    c.metadata,
    (1 - (c.chunk_embedding <=> query_embedding))::float as similarity,
    (c.chunk_embedding <=> query_embedding)::float as distance,
    d.original_filename
  FROM rag_document_chunks c
  INNER JOIN rag_documents d ON c.document_id = d.id
  WHERE 
    (project_id IS NULL OR d.project_id = project_id)
    AND (1 - (c.chunk_embedding <=> query_embedding)) >= match_threshold
  ORDER BY c.chunk_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION search_rag_chunks TO authenticated;

-- Add comment explaining the function
COMMENT ON FUNCTION search_rag_chunks IS 'Performs vector similarity search on RAG document chunks using cosine similarity';
