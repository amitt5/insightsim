# 🚀 Full RAG Upgrade Guide

## Overview
This guide upgrades your RAG system from simple text storage to a complete semantic search system with:

- **Document Chunking**: Smart text splitting into 512-character segments
- **OpenAI Embeddings**: Convert text chunks to vectors using `text-embedding-3-small` 
- **Vector Storage**: Store embeddings in Supabase's pgvector database
- **Semantic Search**: Find relevant content based on meaning, not just keywords

## 📋 Prerequisites

### 1. Environment Variables
Copy `env-template.txt` to create your `.env` file with these variables:

```bash
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_key_here
SUPABASE_DB_PASSWORD=your_database_password  # Find in Supabase Settings > Database
OPENAI_API_KEY=sk-your_openai_key_here

# Optional (uses defaults if not set)
EMBEDDING_MODEL=text-embedding-3-small
CHUNK_SIZE=512
CHUNK_OVERLAP=50
```

### 2. Database Setup
Run this SQL in your Supabase SQL editor:

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO postgres;
GRANT CREATE ON SCHEMA public TO postgres;
```

Or use the provided script:
```bash
# Copy contents of setup-vector-db.sql and run in Supabase SQL editor
```

## 🚀 Starting the Full RAG Service

### Option 1: Direct Python Execution
```bash
cd python-rag-service
source venv/bin/activate
PYTHONPATH=/Users/macpro/dev1/insightsim/python-rag-service python3 app/main-full.py
```

### Option 2: Module Execution  
```bash
cd python-rag-service
source venv/bin/activate
PYTHONPATH=/Users/macpro/dev1/insightsim/python-rag-service python3 -m app.main-full
```

## 🔄 What Changed

### Document Processing Flow
**Before (Simple):**
```
Upload → Download → Store raw text → Mark completed
```

**After (Full RAG):**
```
Upload → Download → Create Document → Chunk text → Generate embeddings → Store vectors → Mark completed
```

### Processing Steps Detail
1. **Download**: Get file from Supabase Storage
2. **Create Document**: LlamaIndex document with metadata
3. **Chunking**: Split into 512-character chunks with 50-char overlap
4. **Embeddings**: Generate OpenAI vectors for each chunk
5. **Vector Storage**: Store in Supabase pgvector database
6. **Indexing**: Create searchable index for semantic retrieval

### Context Retrieval
**Before:** Simple keyword matching or mock responses
**After:** True semantic search using vector similarity

## 🧪 Testing the Upgrade

### 1. Health Check
```bash
curl http://localhost:8000/health
```
Expected response:
```json
{
  "status": "healthy",
  "service": "full-rag", 
  "features": ["chunking", "embeddings", "semantic-search"]
}
```

### 2. Supabase Connection Test
```bash
curl -X POST http://localhost:8000/test-supabase
```
Expected response:
```json
{
  "status": "success",
  "message": "Full RAG service connected to Supabase successfully",
  "features": {
    "chunking": "SentenceSplitter with 512 char chunks",
    "embeddings": "OpenAI text-embedding-3-small", 
    "vector_store": "Supabase pgvector",
    "search": "Semantic similarity search"
  }
}
```

### 3. Document Upload Test
1. Upload a text document through the Next.js interface
2. Watch processing status: `pending` → `processing` → `completed`
3. Processing should take 15-45 seconds (vs 1-3 seconds for simple)
4. Check Supabase database for vector tables: `vecs.simulation_*`

### 4. Semantic Search Test
Try queries that test semantic understanding:
- Upload a document about "customer satisfaction"
- Query for "happy clients" - should find relevant chunks
- Query for "user experience" - should find related content

## 📊 Performance Expectations

### Processing Time
- **Simple RAG**: 1-3 seconds per document
- **Full RAG**: 15-45 seconds per document (due to embedding generation)

### Storage Usage
- **Simple RAG**: Only original document in DB
- **Full RAG**: Document + vector embeddings (significantly more storage)

### Query Performance
- **Simple RAG**: Fast but basic matching
- **Full RAG**: Slower but much more accurate semantic search

## 🔧 Configuration Options

### Chunking Settings
Adjust in the RAG service initialization:
```python
Settings.text_splitter = SentenceSplitter(
    chunk_size=512,      # Smaller = more precise, more chunks
    chunk_overlap=50,    # Prevents context loss at boundaries
)
```

### Embedding Model
Change in environment:
```bash
EMBEDDING_MODEL=text-embedding-3-large  # Higher quality, more expensive
```

### Search Parameters
Modify in retrieval calls:
```python
similarity_top_k=5  # Number of chunks to retrieve
```

## 🚨 Troubleshooting

### Common Issues

1. **"Missing OpenAI API Key"**
   - Add `OPENAI_API_KEY` to your `.env` file
   - Ensure the key has sufficient credits

2. **"Vector store connection failed"**
   - Check `SUPABASE_DB_PASSWORD` is correct
   - Ensure pgvector extension is enabled
   - Verify database permissions

3. **"Embedding generation failed"**
   - Check OpenAI API key validity
   - Verify network connectivity
   - Check OpenAI service status

4. **Processing takes too long**
   - Normal for first run (downloading models)
   - Large documents take more time
   - Check OpenAI rate limits

### Fallback Behavior
If vector storage fails, the service automatically falls back to simple text-based responses to maintain functionality.

## 📈 Next Steps

After confirming the full RAG system works:

1. **Chat Integration**: Connect semantic search to conversation flows
2. **RAG Settings**: Add user controls for search parameters  
3. **Context Display**: Show users what documents informed responses
4. **PDF Support**: Extend to handle PDF documents with OCR
5. **Performance Optimization**: Implement caching and batch processing

## 🎯 Success Criteria

You'll know the upgrade is successful when:

- ✅ Health check shows "full-rag" service with all features
- ✅ Document processing takes 15-45 seconds (longer than before)
- ✅ Vector tables appear in Supabase (`vecs.simulation_*`)
- ✅ Semantic queries return relevant results (not just keyword matches)
- ✅ Context retrieval works with meaningful document chunks

The upgrade provides the foundation for truly intelligent document-aware AI conversations! 🎉 