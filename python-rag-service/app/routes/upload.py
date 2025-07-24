from fastapi import APIRouter, BackgroundTasks, HTTPException
from app.services.rag_service import get_full_rag_service
from app.models.schemas import ProcessDocumentRequest, ProcessingResponse, DocumentStatusResponse
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/process-document", response_model=ProcessingResponse)
async def process_document_full(
    request: ProcessDocumentRequest, 
    background_tasks: BackgroundTasks
):
    """Process uploaded document with full chunking and embeddings"""
    try:
        logger.info(f"Received full RAG processing request: {request.document_id}")
        
        # Add background task for full document processing
        background_tasks.add_task(
            get_full_rag_service().process_document,
            request.simulation_id,
            request.document_id,
            request.storage_path
        )
        
        return ProcessingResponse(
            status="processing",
            message="Document processing started with full chunking and embeddings",
            document_id=request.document_id
        )
        
    except Exception as e:
        logger.error(f"Error starting full RAG processing: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/document/{document_id}/status", response_model=DocumentStatusResponse)
async def get_document_status(document_id: str):
    """Get document processing status"""
    try:
        logger.info(f"Getting status for document: {document_id}")
        
        service = get_full_rag_service()
        
        # Get document status from database
        response = service.supabase.table("rag_documents").select("processing_status").eq("id", document_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Document not found")
        
        status = response.data[0]["processing_status"]
        
        return DocumentStatusResponse(
            document_id=document_id,
            status=status
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting document status: {e}")
        raise HTTPException(status_code=500, detail=str(e)) 