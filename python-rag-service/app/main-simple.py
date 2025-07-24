from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

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
        "app.main-simple:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=True
    ) 