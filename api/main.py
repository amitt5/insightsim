from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict, Any
import os
import json
from datetime import datetime
import uuid

from models import StudyMetadata,StatusResponse, UploadResponse, ErrorResponse, AnalysisStatus
from utils import validate_file, save_uploaded_file, generate_study_id, create_upload_directory
from document_processor import document_processor

analysis_jobs = {}

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

# Add this new endpoint to your FastAPI app (after your existing routes)
@app.post("/api/analysis/upload", response_model=UploadResponse)
async def upload_transcripts(
    files: List[UploadFile] = File(...),
    metadata: str = Form(...)
):
    """Upload transcript files with study metadata"""
    try:
        # Parse metadata JSON from form data
        try:
            metadata_dict = json.loads(metadata)
            study_metadata = StudyMetadata(**metadata_dict)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid metadata format")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Metadata validation error: {str(e)}")
        
        # Validate files
        if not files or len(files) == 0:
            raise HTTPException(status_code=400, detail="No files uploaded")
        
        # Generate unique study ID
        study_id = generate_study_id()
        
        # Process and save files
        saved_files = []
        for file in files:
            # Validate file
            file_info = validate_file(file)
            
            # Save file
            file_path = await save_uploaded_file(file, study_id)
            saved_files.append({
                "filename": file_info.filename,
                "path": file_path,
                "type": file_info.file_type,
                "size": file_info.file_size
            })
        
        # Create response
        response = UploadResponse(
            study_id=study_id,
            message=f"Successfully uploaded {len(saved_files)} files",
            files_uploaded=len(saved_files),
            status=AnalysisStatus.PENDING,
            created_at=datetime.now()
        )

        analysis_jobs[study_id] = {
            "status": AnalysisStatus.PENDING,
            "created_at": datetime.now(),
            "metadata": study_metadata.dict(),
            "files": saved_files,
            "message": "Files uploaded successfully"
        }
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")



@app.get("/api/analysis/{study_id}/status", response_model=StatusResponse)
async def get_analysis_status(study_id: str):
    """Get analysis status for a study"""
    if study_id not in analysis_jobs:
        raise HTTPException(status_code=404, detail="Study not found")
    
    job = analysis_jobs[study_id]
    return StatusResponse(
        study_id=study_id,
        status=job["status"],
        progress=job.get("progress"),
        message=job.get("message"),
        created_at=job["created_at"],
        updated_at=job.get("updated_at", job["created_at"])
    )

@app.post("/api/analysis/{study_id}/start")
async def start_analysis(study_id: str):
    """Start analysis for uploaded transcripts"""
    if study_id not in analysis_jobs:
        raise HTTPException(status_code=404, detail="Study not found")
    
    # Update status to processing
    analysis_jobs[study_id]["status"] = AnalysisStatus.PROCESSING
    analysis_jobs[study_id]["updated_at"] = datetime.now()
    analysis_jobs[study_id]["message"] = "Analysis started"
    
    return {"message": "Analysis started successfully", "study_id": study_id}

@app.get("/api/analysis/{study_id}/results")
async def get_analysis_results(study_id: str):
    """Get analysis results for a completed study"""
    if study_id not in analysis_jobs:
        raise HTTPException(status_code=404, detail="Study not found")
    
    job = analysis_jobs[study_id]
    if job["status"] != AnalysisStatus.COMPLETED:
        raise HTTPException(
            status_code=400, 
            detail=f"Analysis not completed. Current status: {job['status']}"
        )
    
    # Return mock results for now (will be replaced with real analysis in later steps)
    return {
        "study_id": study_id,
        "status": "completed",
        "results": {
            "summary": "Mock analysis results - will be implemented in Step 7",
            "themes": [],
            "insights": []
        }
    }

# Add this import at the top with your other imports
from document_processor import document_processor

# Add this new endpoint after your existing endpoints
@app.get("/api/analysis/{study_id}/extract-text")
async def extract_study_text(study_id: str):
    """Extract text content from all files in a study"""
    try:
        # Process all files for the study
        text_summary = document_processor.get_study_text_summary(study_id)
        
        return {
            "study_id": study_id,
            "status": "success",
            "extraction_summary": {
                "file_count": text_summary["file_count"],
                "total_words": text_summary["total_words"],
                "total_characters": text_summary["total_characters"],
                "total_pages": text_summary["total_pages"],
                "files_processed": text_summary["files_processed"]
            },
            "text_preview": text_summary["combined_text"][:500] + "..." if len(text_summary["combined_text"]) > 500 else text_summary["combined_text"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Text extraction failed: {str(e)}"
        )

@app.get("/api/analysis/{study_id}/full-text")
async def get_full_study_text(study_id: str):
    """Get complete extracted text for a study"""
    try:
        text_summary = document_processor.get_study_text_summary(study_id)
        
        return {
            "study_id": study_id,
            "combined_text": text_summary["combined_text"],
            "metadata": {
                "file_count": text_summary["file_count"],
                "total_words": text_summary["total_words"],
                "total_characters": text_summary["total_characters"],
                "files_processed": text_summary["files_processed"]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve full text: {str(e)}"
        )


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