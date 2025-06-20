-- Enable pgvector extension and create vector tables
-- Run date: 2025-06-20

-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Table for storing transcript chunk embeddings
CREATE TABLE transcript_embeddings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    study_id UUID NOT NULL,
    chunk_id TEXT NOT NULL,
    chunk_text TEXT NOT NULL,
    embedding VECTOR(1536), -- OpenAI ada-002 embedding size
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing theme embeddings
CREATE TABLE theme_embeddings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    study_id UUID NOT NULL,
    theme_name TEXT NOT NULL,
    theme_description TEXT,
    embedding VECTOR(1536),
    frequency INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing insight embeddings
CREATE TABLE insight_embeddings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    study_id UUID NOT NULL,
    insight_title TEXT NOT NULL,
    insight_description TEXT,
    embedding VECTOR(1536),
    business_impact TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX ON transcript_embeddings USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX ON theme_embeddings USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX ON insight_embeddings USING ivfflat (embedding vector_cosine_ops);

-- Create indexes on study_id for filtering
CREATE INDEX idx_transcript_embeddings_study_id ON transcript_embeddings(study_id);
CREATE INDEX idx_theme_embeddings_study_id ON theme_embeddings(study_id);
CREATE INDEX idx_insight_embeddings_study_id ON insight_embeddings(study_id);
