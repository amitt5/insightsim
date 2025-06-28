-- Add analysis results storage table
-- Run date: 2025-06-25
-- Description: Add table to store complete analysis results for retrieval without re-running pipeline

-- Table for storing complete analysis results
CREATE TABLE analysis_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    study_id VARCHAR NOT NULL UNIQUE, -- Using VARCHAR to match pipeline string IDs
    analysis_data JSONB NOT NULL,
    version INTEGER DEFAULT 1, -- For tracking analysis versions
    status VARCHAR DEFAULT 'completed', -- completed, processing, failed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_analysis_results_study_id ON analysis_results(study_id);
CREATE INDEX idx_analysis_results_status ON analysis_results(status);
CREATE INDEX idx_analysis_results_created_at ON analysis_results(created_at DESC);

-- Add function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_analysis_results_updated_at 
    BEFORE UPDATE ON analysis_results 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE analysis_results IS 'Stores complete analysis results including themes, insights, quotes, and dashboard data';
COMMENT ON COLUMN analysis_results.study_id IS 'Unique identifier for the study (matches pipeline string format)';
COMMENT ON COLUMN analysis_results.analysis_data IS 'Complete analysis results in JSONB format including all themes, insights, quotes, and metadata';
COMMENT ON COLUMN analysis_results.version IS 'Version number for tracking analysis iterations';
COMMENT ON COLUMN analysis_results.status IS 'Analysis status: completed, processing, failed'; 