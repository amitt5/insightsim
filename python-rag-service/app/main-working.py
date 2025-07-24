from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import upload_simple, retrieve_simple
import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables from the correct path
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# Create FastAPI app
app = FastAPI(
    title="InsightSim RAG Service",
    description="RAG service for document processing and context retrieval",
    version="1.0.0"
)

# CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
print("Including upload router...")
app.include_router(upload_simple.router, prefix="/api", tags=["upload"])
print("Including retrieve router...")
app.include_router(retrieve_simple.router, prefix="/api", tags=["retrieve"])
print("Routers included successfully")

@app.get("/")
async def root():
    return {"message": "InsightSim RAG Service", "status": "running"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy", 
        "service": "rag-service",
        "version": "1.0.0"
    }

@app.post("/test-supabase")
async def test_supabase():
    """Test Supabase connection"""
    try:
        from supabase import create_client
        
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
        
        if not supabase_url or not supabase_key:
            return {"error": "Missing Supabase credentials"}
        
        supabase = create_client(supabase_url, supabase_key)
        
        # Test a simple query
        response = supabase.table("rag_documents").select("count", count="exact").execute()
        
        return {
            "status": "success",
            "message": "Supabase connection working",
            "document_count": response.count if response.count is not None else 0
        }
        
    except Exception as e:
        return {"error": f"Supabase connection failed: {str(e)}"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main-working:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=True
    ) 