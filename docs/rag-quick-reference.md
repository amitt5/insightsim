# RAG Quick Reference

## 🚀 Quick Start Commands

### Start Python RAG Service
```bash
cd python-rag-service
source venv/bin/activate  # or venv\Scripts\activate on Windows
python app/main.py
```

### Start Next.js Development
```bash
pnpm dev
```

## 📊 Database Quick Queries

### Check Document Status
```sql
-- View all documents and their processing status
SELECT filename, processing_status, upload_date 
FROM rag_documents 
ORDER BY upload_date DESC;

-- Count documents by status
SELECT processing_status, COUNT(*) 
FROM rag_documents 
GROUP BY processing_status;
```

### View RAG Settings
```sql
-- Check which simulations have RAG enabled
SELECT s.study_title, rs.is_enabled, rs.chunk_size
FROM simulations s
JOIN simulation_rag_settings rs ON s.id = rs.simulation_id
WHERE rs.is_enabled = true;
```

### Storage Usage
```sql
-- Check storage usage per user
SELECT user_id, SUM(file_size) as total_bytes
FROM rag_documents 
GROUP BY user_id;

-- View recent uploads
SELECT filename, file_size, upload_date, processing_status
FROM rag_documents
WHERE upload_date > NOW() - INTERVAL '24 hours'
ORDER BY upload_date DESC;
```

## 🔧 API Endpoints

### Next.js API Routes
```
POST /api/rag/upload           # Upload document
GET  /api/rag/documents        # List user documents  
DELETE /api/rag/delete         # Delete document
GET  /api/rag/settings         # Get RAG settings
POST /api/rag/settings         # Update RAG settings
```

### Python FastAPI Endpoints
```
POST /api/process-document     # Process uploaded document
POST /api/retrieve-context     # Get relevant context for query
GET  /api/document/{id}/status # Check processing status
GET  /health                   # Service health check
```

## 🐛 Common Debug Commands

### Check Python Service Health
```bash
curl http://localhost:8000/health
```

### Test Document Processing
```bash
curl -X POST http://localhost:8000/api/process-document \
  -H "Content-Type: application/json" \
  -d '{
    "simulation_id": "sim_123",
    "document_id": "doc_456", 
    "storage_path": "user/sim/file.txt"
  }'
```

### Check Vector Tables
```sql
-- List all vector tables (created by LlamaIndex)
SELECT schemaname, tablename 
FROM pg_tables 
WHERE tablename LIKE 'vecs_%';

-- Count vectors in a simulation's collection
SELECT COUNT(*) FROM vecs_simulation_123;
```

## 📁 File Structure Reference

```
python-rag-service/
├── app/
│   ├── main.py              # FastAPI application
│   ├── models/
│   │   └── schemas.py       # Pydantic models
│   ├── services/
│   │   └── rag_service.py   # LlamaIndex integration
│   ├── routes/
│   │   ├── upload.py        # Document processing
│   │   └── retrieve.py      # Context retrieval
│   └── utils/
├── requirements.txt
├── .env
└── Dockerfile

components/
├── rag-upload-modal.tsx     # File upload interface
├── rag-document-list.tsx    # Document management
├── rag-toggle.tsx           # Enable/disable RAG
└── rag-status-indicator.tsx # Processing status

app/api/rag/
├── upload/route.ts          # File upload handler
├── documents/route.ts       # Document listing
├── delete/route.ts          # Document deletion
└── settings/route.ts        # RAG configuration
```

## 🔍 Troubleshooting Checklist

### Document Upload Issues
- [ ] Check file type is .txt
- [ ] Verify file size under 50MB
- [ ] Confirm user is authenticated
- [ ] Check Supabase storage policies
- [ ] Verify storage bucket exists

### Processing Stuck
- [ ] Check Python service is running
- [ ] Verify OpenAI API key is valid
- [ ] Check database connectivity
- [ ] Review Python service logs
- [ ] Confirm document exists in storage

### RAG Query Failures
- [ ] Ensure RAG is enabled for simulation
- [ ] Check if documents are processed (status = 'completed')
- [ ] Verify vector tables exist
- [ ] Check LlamaIndex configuration
- [ ] Test Python service /health endpoint

## 🌐 Environment Variables Checklist

### Next.js (.env.local)
```bash
SUPABASE_URL=
SUPABASE_ANON_KEY=
PYTHON_RAG_SERVICE_URL=http://localhost:8000
```

### Python Service (.env)
```bash
OPENAI_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
DATABASE_URL=postgresql://postgres:password@host:port/database
HOST=0.0.0.0
PORT=8000
ENVIRONMENT=development
```

## 📝 Configuration Defaults

### RAG Parameters
- **Chunk Size**: 500 tokens
- **Chunk Overlap**: 50 tokens  
- **Embedding Model**: text-embedding-ada-002
- **Similarity Top-K**: 3 chunks
- **Max File Size**: 50MB

### Database Settings
- **Processing Status**: processing | completed | failed
- **Default RAG**: disabled per simulation
- **Collection Naming**: simulation_{simulation_id}

## 🚨 Error Codes Reference

### HTTP Status Codes
- **200**: Success
- **202**: Accepted (async processing started)
- **400**: Bad request (invalid file type, etc.)
- **401**: Unauthorized (not logged in)
- **404**: Not found (document/simulation not found)
- **500**: Internal server error

### Processing Status Values
- **processing**: Document uploaded, being processed
- **completed**: Successfully processed and indexed
- **failed**: Processing failed, needs investigation

## 🔗 Helpful Links

- [RAG Architecture Documentation](./rag-architecture.md)
- [Database Schema Documentation](./rag-database-schema.md) 
- [Setup Guide](./rag-setup-guide.md)
- [LlamaIndex Documentation](https://docs.llamaindex.ai/)
- [Supabase Documentation](https://supabase.com/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)

## 📞 Support

For issues or questions:
1. Check this quick reference first
2. Review error logs in Python service
3. Check Supabase dashboard for data issues
4. Refer to detailed documentation links above 