# RAG Database Schema Documentation

## Overview
This document describes the database schema and SQL commands for the RAG (Retrieval Augmented Generation) functionality in InsightSim.

## Prerequisites
- Supabase project with PostgreSQL database
- pgvector extension enabled

## Database Setup

### 1. Enable pgvector Extension
```sql
-- Enable pgvector extension for vector embeddings
CREATE EXTENSION IF NOT EXISTS vector;
```
**Purpose**: 
- Enables PostgreSQL to store and query vector embeddings
- Required for RAG functionality to store document embeddings
- `IF NOT EXISTS` prevents errors if already enabled

### 2. Core Tables

#### RAG Documents Table
```sql
CREATE TABLE rag_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id UUID REFERENCES simulations(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size INTEGER,
  processing_status TEXT DEFAULT 'processing' CHECK (processing_status IN ('processing', 'completed', 'failed')),
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);
```

**Column Documentation**:
- `id`: Unique identifier for each uploaded document
- `simulation_id`: Links document to specific simulation (foreign key with cascade delete)
- `filename`: Original name of uploaded file (for display purposes)
- `storage_path`: Path to file in Supabase Storage (e.g., "user_id/sim_id/file.txt")
- `file_size`: Size in bytes (for storage management and UI display)
- `processing_status`: Tracks document processing state with constraints
  - `processing`: Document uploaded, being processed by Python service
  - `completed`: Successfully processed and indexed
  - `failed`: Processing failed, needs retry
- `upload_date`: Timestamp with timezone for audit trail
- `user_id`: Links to authenticated user (for RLS and ownership)

#### RAG Settings Table
```sql
CREATE TABLE simulation_rag_settings (
  simulation_id UUID PRIMARY KEY REFERENCES simulations(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT FALSE,
  chunk_size INTEGER DEFAULT 500,
  chunk_overlap INTEGER DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Column Documentation**:
- `simulation_id`: Primary key linking to simulations table
- `is_enabled`: Toggle RAG on/off per simulation (defaults to disabled)
- `chunk_size`: Number of tokens per text chunk (affects retrieval granularity)
- `chunk_overlap`: Overlapping tokens between chunks (prevents context loss)
- `created_at`: When RAG was first enabled for this simulation

### 3. Row Level Security (RLS)

#### Enable RLS
```sql
-- Enable RLS on tables
ALTER TABLE rag_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_rag_settings ENABLE ROW LEVEL SECURITY;
```

#### RLS Policies

**Document Access Policy**
```sql
CREATE POLICY "Users can manage their own RAG documents" 
ON rag_documents 
FOR ALL 
USING (auth.uid() = user_id);
```
- `FOR ALL`: Applies to SELECT, INSERT, UPDATE, DELETE operations
- `USING (auth.uid() = user_id)`: Only allows access when authenticated user ID matches document owner

**Settings Access Policy**
```sql
CREATE POLICY "Users can manage RAG settings for their simulations" 
ON simulation_rag_settings 
FOR ALL 
USING (
  simulation_id IN (
    SELECT id FROM simulations WHERE user_id = auth.uid()
  )
);
```
- Uses subquery to check simulation ownership
- Prevents users from modifying other users' simulation settings

#### Permission Grants
```sql
GRANT ALL ON rag_documents TO authenticated;
GRANT ALL ON simulation_rag_settings TO authenticated;
```

## Storage Setup

### Bucket Creation
- **Name**: `rag-documents`
- **Public**: `false` (private bucket)
- **File size limit**: `50 MB`

### Storage Policies

#### Upload Policy
```sql
CREATE POLICY "Users can upload their own RAG files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'rag-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

#### View Policy
```sql
CREATE POLICY "Users can view their own RAG files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'rag-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

#### Delete Policy
```sql
CREATE POLICY "Users can delete their own RAG files" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'rag-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**Storage Path Structure**: `user_id/simulation_id/timestamp_filename.txt`

## Security Architecture

1. **Database Level**: RLS policies ensure data isolation between users
2. **Storage Level**: File path structure and policies prevent cross-user access
3. **Application Level**: Additional validation in API routes
4. **Cascade Deletion**: When simulations are deleted, all associated RAG documents are automatically removed

## Vector Storage

The actual vector embeddings are stored in tables managed by LlamaIndex's `SupabaseVectorStore`:
- **Collection naming**: `simulation_{simulation_id}`
- **Embedding dimension**: `1536` (OpenAI text-embedding-ada-002)
- **Metadata**: Includes document_id, simulation_id, storage_path

## Usage Notes

- Documents are processed asynchronously after upload
- Processing status should be checked via polling
- Failed documents can be reprocessed
- Each simulation maintains its own vector index
- RLS policies automatically filter data based on user authentication 