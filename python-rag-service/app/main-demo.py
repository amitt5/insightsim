"""
Demo RAG Service - Simulates full RAG functionality without complex dependencies
This demonstrates chunking, embedding simulation, and semantic search concepts
"""

import os
import sys
import uvicorn
import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

# Import simplified routes
from app.routes import upload_simple, retrieve_simple

# Create FastAPI app
app = FastAPI(
    title="InsightSim RAG Service - Demo",
    description="Demo RAG service showing chunking and semantic search concepts",
    version="2.0.0-demo"
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
print("Including demo RAG upload router...")
app.include_router(upload_simple.router, prefix="/api", tags=["upload"])

print("Including demo RAG retrieve router...")
app.include_router(retrieve_simple.router, prefix="/api", tags=["retrieve"])

print("Demo RAG routers included successfully")

@app.get("/")
async def root():
    return {"message": "InsightSim Demo RAG Service", "version": "2.0.0-demo"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy", 
        "service": "demo-rag", 
        "version": "2.0.0-demo",
        "features": ["document-chunking-demo", "semantic-search-simulation", "embedding-concepts"]
    }

@app.post("/test-supabase")
async def test_supabase_connection():
    """Test connection to Supabase"""
    try:
        from app.services.rag_service_simple import get_simple_rag_service
        service = get_simple_rag_service()
        
        # Test database connection
        response = service.supabase.table("rag_documents").select("count").execute()
        
        return {
            "status": "success",
            "message": "Demo RAG service connected to Supabase successfully",
            "demo_features": {
                "chunking": "Simulated 512-char chunks with overlap",
                "embeddings": "Conceptual vector similarity (no actual OpenAI)",
                "search": "Enhanced keyword matching with ranking",
                "storage": "Real Supabase document storage"
            },
            "note": "This demo shows RAG concepts without expensive API calls"
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    print("\n🚀 Starting InsightSim Demo RAG Service...")
    print("📝 Demo Features:")
    print("   • Document Chunking Simulation (512-char segments)")  
    print("   • Semantic Search Concepts (enhanced keyword matching)")
    print("   • Processing Status Tracking")
    print("   • Real Supabase Storage Integration")
    print("🎯 Purpose: Test RAG concepts without complex dependencies")
    print("⚡ API Documentation: http://localhost:8000/docs")
    print("-" * 60)
    
    # Check environment variables
    required_vars = ["SUPABASE_URL", "SUPABASE_SERVICE_KEY"]
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        print(f"❌ Missing required environment variables: {missing_vars}")
        sys.exit(1)
    
    print("✅ Environment variables configured")
    
    openai_key = os.getenv("OPENAI_API_KEY")
    if openai_key:
        print("✅ OpenAI API key found (not needed for demo)")
    else:
        print("ℹ️  OpenAI API key not set (demo works without it)")
    
    print("-" * 60)
    
    uvicorn.run(
        "app.main-demo:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    ) 