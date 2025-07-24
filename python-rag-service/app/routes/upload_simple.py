from fastapi import APIRouter, BackgroundTasks, HTTPException
from app.services.rag_service_simple import get_simple_rag_service
from app.models.schemas import ProcessDocumentRequest, ProcessingResponse, DocumentStatusResponse
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/process-document", response_model=ProcessingResponse)
async def process_document(
    request: ProcessDocumentRequest, 
    background_tasks: BackgroundTasks
):
    """Process uploaded document in background"""
    try:
        logger.info(f"Received document processing request: {request.document_id}")
        
        # Add background task for document processing
        background_tasks.add_task(
            get_simple_rag_service().add_document_simple,
            request.simulation_id,
            request.document_id,
            request.storage_path
        )
        
        return ProcessingResponse(
            status="processing",
            message="Document processing started",
            document_id=request.document_id
        )
        
    except Exception as e:
        logger.error(f"Error starting document processing: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to start document processing: {str(e)}"
        )

@router.get("/document/{document_id}/status", response_model=DocumentStatusResponse)
async def get_document_status(document_id: str):
    """Get processing status of a document"""
    try:
        # Query database for document status
        response = get_simple_rag_service().supabase.table("rag_documents").select("processing_status").eq("id", document_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Document not found")
        
        status = response.data[0]["processing_status"]
        
        return DocumentStatusResponse(
            status=status,
            message=f"Document is {status}"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting document status: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get document status: {str(e)}"
        ) 