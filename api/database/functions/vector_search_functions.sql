-- Vector search functions for semantic similarity
-- Run date: 2025-06-20
-- Function to match similar themes
CREATE OR REPLACE FUNCTION match_themes(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5,
  study_filter UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  study_id UUID,
  theme_name TEXT,
  theme_description TEXT,
  frequency INTEGER,
  similarity FLOAT,
  metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    theme_embeddings.id,
    theme_embeddings.study_id,
    theme_embeddings.theme_name,
    theme_embeddings.theme_description,
    theme_embeddings.frequency,
    1 - (theme_embeddings.embedding <=> query_embedding) AS similarity,
    theme_embeddings.metadata
  FROM theme_embeddings
  WHERE 
    (study_filter IS NULL OR theme_embeddings.study_id = study_filter)
    AND 1 - (theme_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY theme_embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to match similar insights
CREATE OR REPLACE FUNCTION match_insights(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5,
  study_filter UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  study_id UUID,
  insight_title TEXT,
  insight_description TEXT,
  business_impact TEXT,
  similarity FLOAT,
  metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    insight_embeddings.id,
    insight_embeddings.study_id,
    insight_embeddings.insight_title,
    insight_embeddings.insight_description,
    insight_embeddings.business_impact,
    1 - (insight_embeddings.embedding <=> query_embedding) AS similarity,
    insight_embeddings.metadata
  FROM insight_embeddings
  WHERE 
    (study_filter IS NULL OR insight_embeddings.study_id = study_filter)
    AND 1 - (insight_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY insight_embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;