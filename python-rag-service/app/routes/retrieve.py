from fastapi import APIRouter, HTTPException
from app.services.rag_service import rag_service
from app.models.schemas import RAGQueryRequest, RAGQueryResponse
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/retrieve-context", response_model=RAGQueryResponse)
async def retrieve_context(request: RAGQueryRequest):
    """Retrieve relevant context for a query"""
    try:
        logger.info(f"Retrieving context for simulation {request.simulation_id}")
        
        # Get context from RAG service
        result = await rag_service.retrieve_context(
            simulation_id=request.simulation_id,
            query=request.query,
            max_chunks=request.max_chunks
        )
        
        return RAGQueryResponse(
            context=result["context"],
            chunks=result["chunks"],
            total_chunks=result["total_chunks"]
        )
        
    except Exception as e:
        logger.error(f"Error retrieving context: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve context: {str(e)}"
        )

@router.delete("/document/{document_id}")
async def delete_document(document_id: str, simulation_id: str):
    """Delete a document from the RAG system"""
    try:
        logger.info(f"Deleting document {document_id} from simulation {simulation_id}")
        
        success = await rag_service.delete_document(simulation_id, document_id)
        
        if success:
            return {"status": "success", "message": "Document deleted successfully"}
        else:
            raise HTTPException(
                status_code=404,
                detail="Document not found or could not be deleted"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting document: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete document: {str(e)}"
        ) 