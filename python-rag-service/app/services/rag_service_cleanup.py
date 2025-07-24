"""
Simplified vector cleanup service for document deletion
"""
import os
import logging
from supabase import create_client, Client

logger = logging.getLogger(__name__)

class VectorCleanupService:
    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)

    async def cleanup_document_vectors(self, document_id: str, simulation_id: str) -> bool:
        """Clean up vector embeddings for a deleted document"""
        try:
            logger.info(f"Cleaning up vectors for document {document_id}")
            
            # For now, log what would be cleaned up
            # In a production environment, this would connect to the vector database
            # and remove all chunks with metadata.document_id = document_id
            
            collection_name = f"simulation_{simulation_id.replace('-', '_')}"
            logger.info(f"Would clean up vectors in collection: {collection_name}")
            logger.info(f"Would delete all vectors where metadata.document_id = {document_id}")
            
            # TODO: Implement actual vector cleanup when database connection is ready
            # This requires connecting to the pgvector database directly
            
            return True
            
        except Exception as e:
            logger.error(f"Vector cleanup failed: {e}")
            return False

# Global cleanup service
_cleanup_service = None

def get_cleanup_service() -> VectorCleanupService:
    global _cleanup_service
    if _cleanup_service is None:
        _cleanup_service = VectorCleanupService()
    return _cleanup_service 