-- Analysis results functions for CRUD operations
-- Run date: 2025-06-25

-- Function to get complete analysis results by study_id
CREATE OR REPLACE FUNCTION get_analysis_results(
  study_id_param VARCHAR
)
RETURNS TABLE (
  id UUID,
  study_id VARCHAR,
  analysis_data JSONB,
  version INTEGER,
  status VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ar.id,
    ar.study_id,
    ar.analysis_data,
    ar.version,
    ar.status,
    ar.created_at,
    ar.updated_at
  FROM analysis_results ar
  WHERE ar.study_id = study_id_param
  ORDER BY ar.created_at DESC
  LIMIT 1;
END;
$$;

-- Function to get analysis summary (without full data) for multiple studies
CREATE OR REPLACE FUNCTION get_analysis_summaries(
  study_ids_param VARCHAR[] DEFAULT NULL,
  limit_param INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  study_id VARCHAR,
  status VARCHAR,
  total_chunks INTEGER,
  total_themes INTEGER,
  total_insights INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ar.id,
    ar.study_id,
    ar.status,
    COALESCE((ar.analysis_data->'metadata'->>'total_chunks')::INTEGER, 0) as total_chunks,
    COALESCE(jsonb_array_length(ar.analysis_data->'study_insights'->'consolidated_themes'), 0) as total_themes,
    COALESCE(jsonb_array_length(ar.analysis_data->'study_insights'->'actionable_insights'), 0) as total_insights,
    ar.created_at,
    ar.updated_at
  FROM analysis_results ar
  WHERE 
    (study_ids_param IS NULL OR ar.study_id = ANY(study_ids_param))
    AND ar.status = 'completed'
  ORDER BY ar.created_at DESC
  LIMIT limit_param;
END;
$$;

-- Function to check if analysis exists for a study
CREATE OR REPLACE FUNCTION analysis_exists(
  study_id_param VARCHAR
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  result BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM analysis_results 
    WHERE study_id = study_id_param 
    AND status = 'completed'
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Function to get analysis metadata only (for quick checks)
CREATE OR REPLACE FUNCTION get_analysis_metadata(
  study_id_param VARCHAR
)
RETURNS TABLE (
  study_id VARCHAR,
  total_chunks INTEGER,
  files_processed TEXT[],
  analysis_timestamp TIMESTAMP WITH TIME ZONE,
  embeddings_stored BOOLEAN,
  version INTEGER,
  status VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ar.study_id,
    COALESCE((ar.analysis_data->'metadata'->>'total_chunks')::INTEGER, 0) as total_chunks,
    ARRAY(SELECT jsonb_array_elements_text(ar.analysis_data->'metadata'->'files_processed')) as files_processed,
    (ar.analysis_data->'metadata'->>'analysis_timestamp')::TIMESTAMP WITH TIME ZONE as analysis_timestamp,
    COALESCE((ar.analysis_data->'metadata'->>'embeddings_stored')::BOOLEAN, false) as embeddings_stored,
    ar.version,
    ar.status
  FROM analysis_results ar
  WHERE ar.study_id = study_id_param
  ORDER BY ar.created_at DESC
  LIMIT 1;
END;
$$;

-- Add comments for documentation
COMMENT ON FUNCTION get_analysis_results(VARCHAR) IS 'Retrieve complete analysis results for a study';
COMMENT ON FUNCTION get_analysis_summaries(VARCHAR[], INTEGER) IS 'Get analysis summaries for multiple studies with key metrics';
COMMENT ON FUNCTION analysis_exists(VARCHAR) IS 'Check if completed analysis exists for a study';
COMMENT ON FUNCTION get_analysis_metadata(VARCHAR) IS 'Get analysis metadata without full results for quick checks'; 