-- Create project_analysis table
-- Stores LLM-generated analysis results for projects (synthetic, human, combined)

CREATE TABLE IF NOT EXISTS project_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    source TEXT NOT NULL CHECK (source IN ('synthetic', 'human', 'combined')),
    analysis_json JSONB NOT NULL,
    model TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Ensure one analysis record per project per source type
    UNIQUE(project_id, source)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_project_analysis_project_id ON project_analysis(project_id);
CREATE INDEX IF NOT EXISTS idx_project_analysis_source ON project_analysis(source);
CREATE INDEX IF NOT EXISTS idx_project_analysis_project_source ON project_analysis(project_id, source);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_project_analysis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on row updates
CREATE TRIGGER trigger_update_project_analysis_updated_at
    BEFORE UPDATE ON project_analysis
    FOR EACH ROW
    EXECUTE FUNCTION update_project_analysis_updated_at();

-- Add comment to table
COMMENT ON TABLE project_analysis IS 'Stores LLM-generated analysis results for projects, supporting synthetic, human, and combined analysis types';

-- Add comments to columns
COMMENT ON COLUMN project_analysis.source IS 'Type of analysis: synthetic (simulations), human (interviews), or combined';
COMMENT ON COLUMN project_analysis.analysis_json IS 'The complete analysis object from LLM in JSON format';
COMMENT ON COLUMN project_analysis.model IS 'The LLM model used to generate the analysis (e.g., gpt-4o-mini)';

