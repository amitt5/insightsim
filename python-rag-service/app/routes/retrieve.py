from fastapi import APIRouter, HTTPException
from app.services.rag_service import get_full_rag_service
from app.models.schemas import RAGQueryRequest, RAGQueryResponse
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/retrieve-context", response_model=RAGQueryResponse)
async def retrieve_context_full(request: RAGQueryRequest):
    """Retrieve relevant context using full semantic search with embeddings"""
    try:
        logger.info(f"Retrieving context for simulation {request.simulation_id} with full RAG")
        
        service = get_full_rag_service()
        
        # Use the full RAG service for semantic search
        result = await service.retrieve_context(
            simulation_id=request.simulation_id,
            query=request.query,
            max_chunks=request.max_chunks
        )
        
        return RAGQueryResponse(
            context=result["context"],
            chunks=result["chunks"],
            total_chunks=result["total_chunks"],
            query=request.query
        )
        
    except Exception as e:
        logger.error(f"Error retrieving context with full RAG: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/document/{document_id}")
async def delete_document_full(document_id: str):
    """Delete document and its vector embeddings"""
    try:
        logger.info(f"Deleting document {document_id} with full cleanup")
        
        service = get_full_rag_service()
        
        # Use the full RAG service for complete cleanup
        success = await service.delete_document(document_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Document not found")
        
        return {"message": "Document and embeddings deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting document with full RAG: {e}")
        raise HTTPException(status_code=500, detail=str(e)) 