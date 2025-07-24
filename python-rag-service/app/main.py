from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import upload, retrieve
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

# Include routers
app.include_router(upload.router, prefix="/api", tags=["upload"])
app.include_router(retrieve.router, prefix="/api", tags=["retrieve"])

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=True
    ) 