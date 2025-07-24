"""
FastAPI application with full RAG capabilities including:
- Document chunking with SentenceSplitter
- OpenAI embeddings generation
- Supabase pgvector storage
- Semantic search for context retrieval
"""

import os
import sys
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

# Import routes with full RAG functionality
from app.routes import upload, retrieve

# Create FastAPI app
app = FastAPI(
    title="InsightSim RAG Service - Full",
    description="Complete RAG service with chunking, embeddings, and semantic search",
    version="2.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
print("Including full RAG upload router...")
app.include_router(upload.router, prefix="/api", tags=["upload"])

print("Including full RAG retrieve router...")
app.include_router(retrieve.router, prefix="/api", tags=["retrieve"])

print("Full RAG routers included successfully")

@app.get("/")
async def root():
    return {"message": "InsightSim Full RAG Service", "version": "2.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "full-rag", "features": ["chunking", "embeddings", "semantic-search"]}

@app.post("/test-supabase")
async def test_supabase_connection():
    """Test connection to Supabase"""
    try:
        from app.services.rag_service import get_full_rag_service
        service = get_full_rag_service()
        
        # Test database connection
        response = service.supabase.table("rag_documents").select("count").execute()
        
        return {
            "status": "success",
            "message": "Full RAG service connected to Supabase successfully",
            "features": {
                "chunking": "SentenceSplitter with 512 char chunks",
                "embeddings": "OpenAI text-embedding-3-small",
                "vector_store": "Supabase pgvector",
                "search": "Semantic similarity search"
            }
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    print("\n🚀 Starting InsightSim Full RAG Service...")
    print("📝 Features: Document Chunking + OpenAI Embeddings + Semantic Search")
    print("🔍 Vector Store: Supabase pgvector")
    print("⚡ API Documentation: http://localhost:8000/docs")
    print("-" * 60)
    
    # Check environment variables
    required_vars = ["SUPABASE_URL", "SUPABASE_SERVICE_KEY"]
    optional_vars = ["OPENAI_API_KEY", "SUPABASE_DB_PASSWORD"]
    
    missing_required = [var for var in required_vars if not os.getenv(var)]
    missing_optional = [var for var in optional_vars if not os.getenv(var)]
    
    if missing_required:
        print(f"❌ Missing required environment variables: {missing_required}")
        sys.exit(1)
    
    if missing_optional:
        print(f"⚠️  Missing optional environment variables: {missing_optional}")
        print("   → OpenAI embeddings and vector storage may not work properly")
    
    print("✅ Environment variables configured")
    print("-" * 60)
    
    uvicorn.run(
        "app.main-full:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    ) 