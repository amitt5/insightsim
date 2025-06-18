from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict, Any
import os
import json
from datetime import datetime
import uuid

# Initialize FastAPI app
app = FastAPI(
    title="InsightSim Analysis API",
    description="Backend API for qualitative research analysis using LlamaIndex",
    version="1.0.0"
)

# Configure CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js development server
        "https://insightsim.vercel.app",  # Production domain (update as needed)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/")
async def root():
    return {
        "message": "InsightSim Analysis API",
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "InsightSim Analysis API",
        "timestamp": datetime.now().isoformat()
    }

# Analysis endpoints (to be implemented)
@app.post("/analysis/upload")
async def upload_transcripts(
    files: List[UploadFile] = File(...),
    metadata: str = Form(...)
):
    """
    Upload transcript files and metadata for analysis
    """
    try:
        # Parse metadata from form data
        metadata_dict = json.loads(metadata)
        
        # Generate analysis ID
        analysis_id = str(uuid.uuid4())
        
        # TODO: Implement file processing with LlamaIndex
        # For now, return mock response
        return JSONResponse(
            status_code=200,
            content={
                "analysis_id": analysis_id,
                "status": "uploaded",
                "files_received": len(files),
                "metadata": metadata_dict,
                "message": "Files uploaded successfully. Analysis will begin shortly."
            }
        )
    
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid metadata format")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@app.post("/analysis/{analysis_id}/process")
async def process_analysis(analysis_id: str):
    """
    Start processing uploaded transcripts
    """
    try:
        # TODO: Implement LlamaIndex processing
        # For now, return mock response
        return JSONResponse(
            status_code=200,
            content={
                "analysis_id": analysis_id,
                "status": "processing",
                "message": "Analysis started successfully"
            }
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

@app.get("/analysis/{analysis_id}/status")
async def get_analysis_status(analysis_id: str):
    """
    Get the status of an analysis
    """
    try:
        # TODO: Implement status checking
        # For now, return mock response
        return JSONResponse(
            status_code=200,
            content={
                "analysis_id": analysis_id,
                "status": "completed",
                "progress": 100,
                "message": "Analysis completed successfully"
            }
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Status check failed: {str(e)}")

@app.get("/analysis/{analysis_id}/results")
async def get_analysis_results(analysis_id: str):
    """
    Get the results of a completed analysis
    """
    try:
        # TODO: Implement results retrieval
        # For now, return mock response structure
        return JSONResponse(
            status_code=200,
            content={
                "analysis_id": analysis_id,
                "status": "completed",
                "results": {
                    "individual_summaries": [],
                    "combined_analysis": {},
                    "themes": [],
                    "patterns": {
                        "demographic_patterns": [],
                        "cooccurrence_patterns": [],
                        "intensity_patterns": [],
                        "temporal_patterns": []
                    }
                },
                "generated_at": datetime.now().isoformat()
            }
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Results retrieval failed: {str(e)}")

# Error handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={"message": "Endpoint not found"}
    )

@app.exception_handler(500)
async def server_error_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"message": "Internal server error"}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 