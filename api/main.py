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

import time
from vector_processor import VectorProcessor, EmbeddingManager, SemanticSearchEngine
from fastapi import BackgroundTasks
import asyncio


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
        "https://insightsim.ai",  # Production domain (update as needed)
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


# ADD THIS: New endpoint for getting transcripts
@app.get("/api/transcripts")
async def get_transcripts():
    try:
        # Replace this with your actual database query
        # For now, returning mock data - you'll need to connect to your Supabase
        transcripts_list = [
            {
                "id": "1",
                "name": "Focus Group 1",
                "status": "completed",
                "created_at": "2025-06-20T10:00:00Z",
                "file_size": "2.5MB"
            },
            {
                "id": "2", 
                "name": "Interview Session 2",
                "status": "processing",
                "created_at": "2025-06-20T14:30:00Z",
                "file_size": "1.8MB"
            }
        ]
        
        return {"transcripts": transcripts_list}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch transcripts: {str(e)}")

# ADD THIS: Get single transcript
@app.get("/api/transcripts/{transcript_id}")
async def get_transcript(transcript_id: str):
    try:
        # Replace with actual database query
        transcript = {
            "id": transcript_id,
            "name": f"Transcript {transcript_id}",
            "status": "completed",
            "content": "Sample transcript content...",
            "analysis": {}
        }
        return transcript
    except Exception as e:
        raise HTTPException(status_code=404, detail="Transcript not found")

async def run_analysis_pipeline(study_id: str):
    """Execute the complete analysis pipeline for a study"""
    try:
        # Get the study data
        study_data = analysis_jobs[study_id]
        uploaded_files = study_data.get("files", [])
        
        # Step 4: Text Extraction
        analysis_jobs[study_id]["current_step"] = "Extracting text from documents..."
        analysis_jobs[study_id]["progress"] = 10
        
        uploaded_files = study_data.get("files", [])
        extracted_texts = {}
        for file_info in uploaded_files:
            file_path = file_info["file_path"]
            filename = file_info["filename"]
            
            try:
                # Use your existing extract_text_from_file function
                text_content = document_processor.extract_text_from_file(file_path)
                extracted_texts[filename] = {
                    "text": text_content,
                    "file_path": file_path,
                    "word_count": len(text_content.split())
                }
            except Exception as e:
                print(f"Error extracting text from {filename}: {str(e)}")

        # Store extracted texts in the job data
        analysis_jobs[study_id]["extracted_texts"] = extracted_texts

        # Step 5: Document Chunking  
        analysis_jobs[study_id]["current_step"] = "Chunking documents..."
        analysis_jobs[study_id]["progress"] = 25
        
        # Get extracted texts from previous step
        extracted_texts = analysis_jobs[study_id]["extracted_texts"]
        chunked_documents = {}

        for filename, text_data in extracted_texts.items():
            text_content = text_data["text"]
            
            try:
                # Use your existing chunk_text function
                chunks = transcript_chunker.chunk_study_content(study_id, text_content)
                chunked_documents[filename] = {
                    "chunks": chunks,
                    "chunk_count": len(chunks),
                    "original_text": text_content
                }
            except Exception as e:
                print(f"Error chunking {filename}: {str(e)}")

        # Store chunked documents in the job data
        analysis_jobs[study_id]["chunked_documents"] = chunked_documents
        analysis_results = {}
        
        # Step 6: LLM Analysis
        analysis_jobs[study_id]["current_step"] = "Analyzing content with AI..."
        analysis_jobs[study_id]["progress"] = 50

        for filename, chunk_data in chunked_documents.items():
            chunks = chunk_data["chunks"]
            
            try:
                # Use your existing analyze_chunks function
                chunk_analysis = llm_analyzer.analyze_study_chunks(chunks)
                analysis_results[filename] = chunk_analysis
            except Exception as e:
                print(f"Error analyzing chunks for {filename}: {str(e)}")

        # Store analysis results in the job data
        analysis_jobs[study_id]["analysis_results"] = analysis_results

        chunked_documents = analysis_jobs[study_id]["chunked_documents"]

        # Step 7-9: Individual and Cross-transcript Analysis
        analysis_jobs[study_id]["current_step"] = "Generating insights..."
        analysis_jobs[study_id]["progress"] = 75
        analysis_results = analysis_jobs[study_id]["analysis_results"]

        try:
            # Use your existing generate_study_insights function
            study_insights = llm_analyzer.analyze_complete_transcript(study_id, analysis_results)
            
            # Store study insights in the job data
            analysis_jobs[study_id]["study_insights"] = study_insights
            
        except Exception as e:
            print(f"Error generating study insights: {str(e)}")

        

        # TODO: Add your insight generation logic here
        
        # Step 10-12: Vector Storage and Semantic Search
        analysis_jobs[study_id]["current_step"] = "Building search index..."
        analysis_jobs[study_id]["progress"] = 90
        

        # Get study insights from previous step
        study_insights = analysis_jobs[study_id]["study_insights"]

        try:
            # Use your existing store_embeddings function
            embedding_result = vector_processor.store_transcript_embeddings(study_id, study_insights)
            
            # Store embedding results in the job data
            analysis_jobs[study_id]["embeddings_stored"] = embedding_result
            
        except Exception as e:
            print(f"Error storing embeddings: {str(e)}")


        # Final completion
        analysis_jobs[study_id]["status"] = "completed"
        analysis_jobs[study_id]["progress"] = 100
        analysis_jobs[study_id]["current_step"] = "Analysis complete!"
        analysis_jobs[study_id]["completed_at"] = datetime.now().isoformat()
        
        # TODO: Store final results
        # analysis_jobs[study_id]["results"] = final_results
        
    except Exception as e:
        analysis_jobs[study_id]["status"] = "failed"
        analysis_jobs[study_id]["error"] = str(e)
        analysis_jobs[study_id]["current_step"] = f"Error: {str(e)}"
        print(f"Analysis failed for study {study_id}: {str(e)}")


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
async def start_analysis(study_id: str, background_tasks: BackgroundTasks):
    """Start analysis for uploaded transcripts"""
    if study_id not in analysis_jobs:
        raise HTTPException(status_code=404, detail="Study not found")
    
    # Update status to processing
    analysis_jobs[study_id]["status"] = AnalysisStatus.PROCESSING
    analysis_jobs[study_id]["updated_at"] = datetime.now()
    analysis_jobs[study_id]["progress"] = 0
    analysis_jobs[study_id]["message"] = "Analysis started"
    analysis_jobs[study_id]["current_step"] = "Starting analysis..."

    background_tasks.add_task(run_analysis_pipeline, study_id)

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

# step 11

@app.post("/api/embeddings/batch-process")
async def batch_process_embeddings(study_ids: List[str], force_refresh: bool = False):
    """Process embeddings for multiple studies in batch"""
    try:
        vector_processor = VectorProcessor()
        embedding_manager = EmbeddingManager(vector_processor)
        
        results = embedding_manager.batch_process_studies(study_ids, force_refresh)
        
        return {
            "status": "completed",
            "batch_results": results,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Batch embedding processing failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Batch processing failed: {str(e)}")

@app.get("/api/search/advanced")
async def advanced_similarity_search(
    query: str,
    search_type: str = "all",
    study_id: str = None,
    similarity_threshold: float = 0.7,
    limit: int = 10
):
    """Advanced similarity search with filtering"""
    try:
        vector_processor = VectorProcessor()
        embedding_manager = EmbeddingManager(vector_processor)
        
        filters = {
            "study_id": study_id,
            "similarity_threshold": similarity_threshold
        }
        
        results = embedding_manager.advanced_similarity_search(query, search_type, filters, limit)
        
        return {
            "status": "success",
            "search_results": results,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Advanced search failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Advanced search failed: {str(e)}")

@app.get("/api/embeddings/statistics")
async def get_embedding_statistics():
    """Get statistics about stored embeddings"""
    try:
        vector_processor = VectorProcessor()
        embedding_manager = EmbeddingManager(vector_processor)
        
        stats = embedding_manager.get_embedding_statistics()
        
        return {
            "status": "success",
            "statistics": stats,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to get embedding statistics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Statistics retrieval failed: {str(e)}")

@app.put("/api/embeddings/{study_id}/refresh")
async def refresh_study_embeddings(study_id: str):
    """Refresh embeddings for a specific study"""
    try:
        # Get fresh analysis
        updated_analysis = await analyze_complete_transcript_internal(study_id)
        
        # Update embeddings
        vector_processor = VectorProcessor()
        embedding_manager = EmbeddingManager(vector_processor)
        
        success = embedding_manager.update_study_embeddings(study_id, updated_analysis)
        
        return {
            "status": "success" if success else "failed",
            "study_id": study_id,
            "embeddings_refreshed": success,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to refresh embeddings: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Embedding refresh failed: {str(e)}")

# step 12
from vector_processor import VectorProcessor, SemanticSearchEngine

@app.get("/api/search/insights/cross-study")
async def search_insights_across_studies(
    query: str,
    min_similarity: float = 0.6,
    business_impact: str = None,
    timeline: str = None,
    study_ids: str = None,
    limit: int = 10
):
    """Search for insights across all studies with business context"""
    try:
        vector_processor = VectorProcessor()
        search_engine = SemanticSearchEngine(vector_processor)
        
        # Build context from parameters
        context = {
            "min_similarity": min_similarity,
            "business_impact": business_impact,
            "timeline": timeline,
            "study_ids": study_ids.split(',') if study_ids else None
        }
        
        results = search_engine.search_insights_across_studies(query, context, limit)
        
        return {
            "status": "success",
            "search_results": results,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Cross-study insight search failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@app.get("/api/search/business-context")
async def search_with_business_context(
    query: str,
    business_scenario: str,
    limit: int = 8
):
    """Search insights with specific business scenario context"""
    try:
        vector_processor = VectorProcessor()
        search_engine = SemanticSearchEngine(vector_processor)
        
        results = search_engine.search_with_business_context(query, business_scenario, limit)
        
        return {
            "status": "success",
            "search_results": results,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Business context search failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Business search failed: {str(e)}")

@app.get("/api/insights/{insight_id}/recommendations")
async def get_insight_recommendations(insight_id: str, limit: int = 5):
    """Get recommended insights based on a specific insight"""
    try:
        vector_processor = VectorProcessor()
        search_engine = SemanticSearchEngine(vector_processor)
        
        recommendations = search_engine.find_insight_recommendations(insight_id, limit)
        
        return {
            "status": "success",
            "insight_id": insight_id,
            "recommendations": recommendations,
            "count": len(recommendations),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Insight recommendations failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Recommendations failed: {str(e)}")


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