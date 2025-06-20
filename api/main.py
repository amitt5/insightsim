import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict, Any
import json
from datetime import datetime
import uuid
from vector_processor import VectorProcessor

from models import StudyMetadata,StatusResponse, UploadResponse, ErrorResponse, AnalysisStatus
from utils import validate_file, save_uploaded_file, generate_study_id, create_upload_directory
from document_processor import document_processor
from text_chunker import transcript_chunker
from llm_analyzer import llm_analyzer
import logging
import traceback


logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

analysis_jobs = {}
load_dotenv()

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

# Add these new endpoints after your existing endpoints - step 5
@app.get("/api/analysis/{study_id}/chunks")
async def get_study_chunks(study_id: str):
    """Generate and return text chunks for a study"""
    try:
        # First, get the full text content from document processor
        logger.info(f"Getting study chunks for study {study_id}")
        text_summary = document_processor.get_study_text_summary(study_id)
        combined_text = text_summary["combined_text"]
        logger.info(f"Combined text: {combined_text}")
        # Create chunks using the transcript chunker
        chunks_data = transcript_chunker.chunk_study_content(study_id, combined_text)
        logger.info(f"Chunks data: {chunks_data}")
        logger.info(f"Chunks111 {chunks_data['chunks']}")
        return {
            "study_id": study_id,
            "status": "success",
            "chunking_summary": chunks_data["chunking_summary"],
            "chunks": chunks_data["chunks"],
            "chunks_preview": [
                {
                    "chunk_id": chunk["chunk_id"],
                    "chunk_index": chunk["chunk_index"],
                    "text_preview": chunk["text"][:200] + "..." if len(chunk["text"]) > 200 else chunk["text"],
                    "metadata": chunk["metadata"]
                }
                for chunk in chunks_data["chunks"][:3]  # Show first 3 chunks as preview
            ],
            "total_chunks": len(chunks_data["chunks"])
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Chunking failed: {str(e)}"
        )

@app.get("/api/analysis/{study_id}/chunks/{chunk_index}")
async def get_specific_chunk(study_id: str, chunk_index: int):
    """Get a specific chunk by index"""
    try:
        # Get full text and create chunks
        text_summary = document_processor.get_study_text_summary(study_id)
        combined_text = text_summary["combined_text"]
        chunks_data = transcript_chunker.chunk_study_content(study_id, combined_text)
        
        # Get specific chunk
        chunk = transcript_chunker.get_chunk_by_index(chunks_data, chunk_index)
        
        if not chunk:
            raise HTTPException(
                status_code=404,
                detail=f"Chunk {chunk_index} not found for study {study_id}"
            )
        
        return {
            "study_id": study_id,
            "chunk": chunk,
            "navigation": {
                "current_index": chunk_index,
                "total_chunks": chunks_data["chunking_summary"]["total_chunks"],
                "has_previous": chunk_index > 0,
                "has_next": chunk_index < chunks_data["chunking_summary"]["total_chunks"] - 1
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve chunk: {str(e)}"
        )

@app.get("/api/analysis/{study_id}/chunks/speaker/{speaker_name}")
async def get_chunks_by_speaker(study_id: str, speaker_name: str):
    """Get all chunks containing a specific speaker"""
    try:
        # Get full text and create chunks
        text_summary = document_processor.get_study_text_summary(study_id)
        combined_text = text_summary["combined_text"]
        chunks_data = transcript_chunker.chunk_study_content(study_id, combined_text)
        
        # Get chunks with specific speaker
        speaker_chunks = transcript_chunker.get_chunks_with_speaker(chunks_data, speaker_name)
        
        if not speaker_chunks:
            raise HTTPException(
                status_code=404,
                detail=f"No chunks found for speaker '{speaker_name}' in study {study_id}"
            )
        
        return {
            "study_id": study_id,
            "speaker_name": speaker_name,
            "chunks_found": len(speaker_chunks),
            "chunks": [
                {
                    "chunk_id": chunk["chunk_id"],
                    "chunk_index": chunk["chunk_index"],
                    "text_preview": chunk["text"][:300] + "..." if len(chunk["text"]) > 300 else chunk["text"],
                    "metadata": chunk["metadata"]
                }
                for chunk in speaker_chunks
            ]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve speaker chunks: {str(e)}"
        )

# Add these new endpoints after your existing endpoints - step 6
@app.post("/api/analysis/{study_id}/analyze")
async def analyze_study_content(
    study_id: str,
    analysis_types: List[str] = ["themes", "quotes", "insights", "patterns"]
):
    """Perform LLM analysis on all chunks in a study"""
    try:
        # Get text content and chunks
        text_summary = document_processor.get_study_text_summary(study_id)
        combined_text = text_summary["combined_text"]
        chunks_data = transcript_chunker.chunk_study_content(study_id, combined_text)
        
        # Perform LLM analysis on all chunks
        analysis_results = llm_analyzer.analyze_study_chunks(chunks_data, analysis_types)
        
        return {
            "study_id": study_id,
            "status": "analysis_complete",
            "analysis_summary": {
                "chunks_analyzed": analysis_results["total_chunks_analyzed"],
                "analysis_types": analysis_results["analysis_types"],
                "total_themes": analysis_results["aggregated_results"]["summary_statistics"]["total_themes"],
                "total_quotes": analysis_results["aggregated_results"]["summary_statistics"]["total_quotes"],
                "total_insights": analysis_results["aggregated_results"]["summary_statistics"]["total_insights"],
                "total_patterns": analysis_results["aggregated_results"]["summary_statistics"]["total_patterns"]
            },
            "results": analysis_results["aggregated_results"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )

@app.get("/api/analysis/{study_id}/themes")
async def get_study_themes(study_id: str):
    """Get extracted themes for a study"""
    try:
        # Get chunks and analyze for themes only
        text_summary = document_processor.get_study_text_summary(study_id)
        combined_text = text_summary["combined_text"]
        chunks_data = transcript_chunker.chunk_study_content(study_id, combined_text)
        
        analysis_results = llm_analyzer.analyze_study_chunks(chunks_data, ["themes"])
        themes = analysis_results["aggregated_results"]["all_themes"]
        
        return {
            "study_id": study_id,
            "total_themes": len(themes),
            "themes": themes
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Theme extraction failed: {str(e)}"
        )

@app.get("/api/analysis/{study_id}/quotes")
async def get_study_quotes(study_id: str):
    """Get extracted quotes for a study"""
    try:
        # Get chunks and analyze for quotes only
        text_summary = document_processor.get_study_text_summary(study_id)
        combined_text = text_summary["combined_text"]
        chunks_data = transcript_chunker.chunk_study_content(study_id, combined_text)
        
        analysis_results = llm_analyzer.analyze_study_chunks(chunks_data, ["quotes"])
        quotes = analysis_results["aggregated_results"]["all_quotes"]
        
        return {
            "study_id": study_id,
            "total_quotes": len(quotes),
            "quotes": quotes
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Quote extraction failed: {str(e)}"
        )

@app.get("/api/analysis/{study_id}/insights")
async def get_study_insights(study_id: str):
    """Get generated insights for a study"""
    try:
        # Get chunks and analyze for insights only
        text_summary = document_processor.get_study_text_summary(study_id)
        combined_text = text_summary["combined_text"]
        chunks_data = transcript_chunker.chunk_study_content(study_id, combined_text)
        
        analysis_results = llm_analyzer.analyze_study_chunks(chunks_data, ["insights"])
        insights = analysis_results["aggregated_results"]["all_insights"]
        
        return {
            "study_id": study_id,
            "total_insights": len(insights),
            "insights": insights
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Insight generation failed: {str(e)}"
        )

@app.post("/api/analysis/{study_id}/chunk/{chunk_index}/analyze")
async def analyze_single_chunk(
    study_id: str, 
    chunk_index: int,
    analysis_types: List[str] = ["themes", "quotes", "insights"]
):
    """Analyze a specific chunk"""
    try:
        logger.info(f"Analyzing chunk {chunk_index} for study {study_id}")
        # Get specific chunk
        text_summary = document_processor.get_study_text_summary(study_id)
        combined_text = text_summary["combined_text"]
        chunks_data = transcript_chunker.chunk_study_content(study_id, combined_text)
        
        chunk = transcript_chunker.get_chunk_by_index(chunks_data, chunk_index)
        if not chunk:
            raise HTTPException(
                status_code=404,
                detail=f"Chunk {chunk_index} not found"
            )
        
        # Analyze the specific chunk
        logger.info(f"Analysing single chunk {chunk_index}")
        chunk_analysis = llm_analyzer.analyze_single_chunk(chunk, analysis_types)
        logger.info(f"Successfully completed analysis for chunk {chunk_index}")
        return {
            "study_id": study_id,
            "chunk_index": chunk_index,
            "analysis_types": analysis_types,
            "results": chunk_analysis
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing chunk {chunk_index}: {str(e)}")
        logger.error(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Chunk analysis failed: {str(e)}"
        )

@app.get("/api/analysis/{study_id}/patterns")
async def get_study_patterns(study_id: str):
    """Get extracted behavioral and demographic patterns for a study"""
    try:
        # Get chunks and analyze for patterns only
        text_summary = document_processor.get_study_text_summary(study_id)
        combined_text = text_summary["combined_text"]
        chunks_data = transcript_chunker.chunk_study_content(study_id, combined_text)
        
        analysis_results = llm_analyzer.analyze_study_chunks(chunks_data, ["patterns"])
        patterns = analysis_results["aggregated_results"]["all_patterns"]
        
        # Group patterns by type for better organization
        patterns_by_type = {}
        for pattern in patterns:
            pattern_type = pattern.get("pattern_type", "other")
            if pattern_type not in patterns_by_type:
                patterns_by_type[pattern_type] = []
            patterns_by_type[pattern_type].append(pattern)
        
        return {
            "study_id": study_id,
            "total_patterns": len(patterns),
            "patterns_by_type": patterns_by_type,
            "all_patterns": patterns
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Pattern analysis failed: {str(e)}"
        )

@app.post("/api/analysis/{study_id}/complete")
async def analyze_complete_transcript(study_id: str):
    """Analyze complete transcript and generate comprehensive report"""
    try:
        logger.info(f"Starting complete transcript analysis for study {study_id}")
        
        # First, analyze all chunks
        study_chunks = await get_study_chunks(study_id)
        chunks = study_chunks["chunks"]
        logger.info(f"Chunks: {chunks}")
        
        chunk_results = []
        for i, chunk in enumerate(chunks):
            try:
                logger.info(f"Analyzing chunk {i}")
                # Analyze each chunk for all types
                themes = llm_analyzer.analyze_chunk_themes(chunk["text"], str(i))
                logger.info(f"Themes: {themes}")
                quotes = llm_analyzer.analyze_chunk_quotes(chunk["text"], str(i))
                logger.info(f"Quotes: {quotes}")
                insights = llm_analyzer.analyze_chunk_insights(chunk["text"], str(i))
                logger.info(f"Insights: {insights}")
                patterns = llm_analyzer.analyze_chunk_patterns(chunk["text"], str(i))
                logger.info(f"Patterns: {patterns}")
                # Combine all analyses for this chunk
                combined_result = {
                    "chunk_id": str(i),
                    "themes": themes.get('themes', []),
                    "quotes": quotes.get('quotes', []),
                    "insights": insights.get('insights', []),
                    "patterns": patterns.get('patterns', []),
                    "error": False
                }
                
                chunk_results.append(combined_result)
                logger.info(f"Completed analysis for chunk {i+1}/{len(chunks)}")
                
            except Exception as e:
                logger.error(f"Failed to analyze chunk {i}: {str(e)}")
                chunk_results.append({
                    "chunk_id": str(i),
                    "error": True,
                    "error_message": str(e)
                })
        
        # Generate complete transcript analysis
        complete_analysis = llm_analyzer.analyze_complete_transcript(study_id, chunk_results)
        
        return {
            "study_id": study_id,
            "status": "completed",
            "chunk_results": chunk_results,
            "complete_analysis": complete_analysis,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Complete transcript analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/api/analysis/cross-transcript")
async def analyze_cross_transcripts(study_ids: List[str]):
    """Analyze patterns across multiple transcripts"""
    try:
        if len(study_ids) < 2:
            raise HTTPException(status_code=400, detail="At least 2 studies required for cross-analysis")
        
        logger.info(f"Starting cross-transcript analysis for studies: {study_ids}")
        
        cross_analysis = await llm_analyzer.analyze_cross_transcript_patterns(study_ids, get_study_chunks)
        
        return {
            "status": "completed",
            "cross_analysis": cross_analysis,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Cross-transcript analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Cross-analysis failed: {str(e)}")

# step 9
@app.get("/api/dashboard/{study_id}")
async def get_dashboard_data(study_id: str):
    """Get formatted data for dashboard display"""
    try:
        logger.info(f"Getting dashboard data for study {study_id}")
        
        # Get existing analysis (you might want to cache this)
        # Try to get cached analysis first, then generate if needed
        analysis_result = await get_or_generate_analysis(study_id)
        
        # Format for dashboard
        dashboard_data = llm_analyzer.format_results_for_dashboard(analysis_result, "single_transcript")
        
        return {
            "status": "success",
            "dashboard_data": dashboard_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Dashboard data retrieval failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Dashboard data failed: {str(e)}")

@app.get("/api/cross-analysis/dashboard")
async def get_cross_analysis_dashboard(study_ids: str = Query(..., description="Comma-separated study IDs")):
    """Get cross-analysis dashboard data"""
    try:
        study_list = study_ids.split(',')
        
        if len(study_list) < 2:
            raise HTTPException(status_code=400, detail="At least 2 studies required")
        
        # Get cross-analysis
        cross_result = await llm_analyzer.analyze_cross_transcript_patterns(study_list, get_study_chunks)
        
        # Format for dashboard
        dashboard_data = llm_analyzer.format_results_for_dashboard(
            {"cross_analysis": cross_result}, 
            "cross_transcript"
        )
        
        return {
            "status": "success",
            "dashboard_data": dashboard_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Cross-analysis dashboard failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Cross-analysis dashboard failed: {str(e)}")

async def get_or_generate_analysis(study_id: str) -> Dict:
    """Get existing analysis or generate new one"""
    # For now, generate fresh analysis
    # In production, you'd check cache/database first
    study_chunks = await get_study_chunks(study_id)
    chunks = study_chunks["chunks"]
    # Generate complete analysis
    chunk_results = []
    for i, chunk in enumerate(chunks):
        # chunk_text = chunk.get('text', '') if isinstance(chunk, dict) else str(chunk)
        chunk_text = chunk["text"]
        themes = llm_analyzer.analyze_chunk_themes(chunk_text, str(i))
        quotes = llm_analyzer.analyze_chunk_quotes(chunk_text, str(i))
        insights = llm_analyzer.analyze_chunk_insights(chunk_text, str(i))
        patterns = llm_analyzer.analyze_chunk_patterns(chunk_text, str(i))
        chunk_results.append({
            "chunk_id": str(i),
            "themes": themes.get('themes', []),
            "quotes": quotes.get('quotes', []),
            "insights": insights.get('insights', []),
            "patterns": patterns.get('patterns', [])
        })
    
    complete_analysis = llm_analyzer.analyze_complete_transcript(study_id, chunk_results)
    
    return {
        "study_id": study_id,
        "status": "completed",
        "chunk_results": chunk_results,
        "complete_analysis": complete_analysis,
        "timestamp": datetime.utcnow().isoformat()
    }

# step 10
from vector_processor import VectorProcessor

@app.post("/api/analysis/{study_id}/complete-with-vectors")
async def analyze_complete_transcript_with_vectors(study_id: str):
    """Analyze complete transcript and store vector embeddings"""
    try:
        logger.info(f"Starting complete analysis with vectors for study {study_id}")
        
        # Run your existing complete analysis
        analysis_result = await analyze_complete_transcript_internal(study_id)
        
        # Process and store vector embeddings
        vector_processor = VectorProcessor()
        vector_success = vector_processor.process_complete_analysis(study_id, analysis_result)
        
        return {
            "study_id": study_id,
            "status": "completed",
            "analysis_result": analysis_result,
            "vector_processing": "success" if vector_success else "failed",
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Complete analysis with vectors failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis with vectors failed: {str(e)}")

@app.get("/api/search/similar-themes")
async def search_similar_themes(query: str, study_id: str = None, limit: int = 5):
    """Search for similar themes using vector similarity"""
    try:
        vector_processor = VectorProcessor()
        similar_themes = vector_processor.find_similar_themes(query, study_id, limit)
        
        return {
            "query": query,
            "similar_themes": similar_themes,
            "count": len(similar_themes)
        }
        
    except Exception as e:
        logger.error(f"Similar themes search failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

async def analyze_complete_transcript_internal(study_id: str) -> Dict:
    """Internal function to analyze complete transcript (reusable)"""
    try:
        logger.info(f"Starting internal complete transcript analysis for study {study_id}")
        
        # Get chunks
        study_chunks = await get_study_chunks(study_id)
        chunks = study_chunks["chunks"]
        
        chunk_results = []
        for i, chunk in enumerate(chunks):
            try:
                logger.info(f"Processing chunk {i+1}/{len(chunks)}")
                
                # Extract chunk text properly based on your structure
                chunk_text = chunk["text"]
                
                chunk_id = str(i)
                
                if not chunk_text:
                    logger.warning(f"No text found for chunk {i}")
                    continue
                
                # Analyze the chunk text
                themes_result = llm_analyzer.analyze_chunk_themes(chunk_text, chunk_id)
                quotes_result = llm_analyzer.analyze_chunk_quotes(chunk_text, chunk_id)
                insights_result = llm_analyzer.analyze_chunk_insights(chunk_text, chunk_id)
                patterns_result = llm_analyzer.analyze_chunk_patterns(chunk_text, chunk_id)
                
                # Combine all analyses for this chunk
                combined_result = {
                    "chunk_id": chunk_id,
                    "chunk_index": i,
                    "themes": themes_result.get('themes', []),
                    "quotes": quotes_result.get('quotes', []),
                    "insights": insights_result.get('insights', []),
                    "patterns": patterns_result.get('patterns', []),
                    "error": False
                }
                
                chunk_results.append(combined_result)
                logger.info(f"Completed analysis for chunk {i+1}/{len(chunks)}")
                
            except Exception as e:
                logger.error(f"Failed to analyze chunk {i}: {str(e)}")
                chunk_results.append({
                    "chunk_id": str(i),
                    "error": True,
                    "error_message": str(e)
                })
        
        # Generate complete transcript analysis
        complete_analysis = llm_analyzer.analyze_complete_transcript(study_id, chunk_results)
        
        return {
            "study_id": study_id,
            "status": "completed",
            "chunk_results": chunk_results,
            "complete_analysis": complete_analysis,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Internal complete transcript analysis failed: {str(e)}")
        raise Exception(f"Internal analysis failed: {str(e)}")


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