import os
from supabase import create_client, Client
from typing import List, Optional, Dict, Any
import logging
import openai
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables at module level
env_path = Path(__file__).parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SimpleRAGService:
    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
        self.openai_key = os.getenv("OPENAI_API_KEY")
        
        if not all([self.supabase_url, self.supabase_key]):
            raise ValueError("Missing required environment variables")
        
        # Initialize clients
        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
        openai.api_key = self.openai_key
        
        logger.info("Simple RAG Service initialized successfully")
    
    async def add_document_simple(self, simulation_id: str, document_id: str, storage_path: str) -> bool:
        """Simple document processing without vector storage for now"""
        try:
            logger.info(f"Processing document {document_id} for simulation {simulation_id}")
            
            # Download file from Supabase Storage
            response = self.supabase.storage.from_("rag-documents").download(storage_path)
            
            if not response:
                raise Exception("Failed to download file from storage")
            
            # Decode file content
            if isinstance(response, bytes):
                file_content = response.decode('utf-8')
            else:
                file_content = str(response)
            
            # For now, just store the content in a simple format
            # In a full implementation, this would be chunked and vectorized
            logger.info(f"File content length: {len(file_content)} characters")
            
            # Update processing status to completed
            self.supabase.table("rag_documents").update({
                "processing_status": "completed"
            }).eq("id", document_id).execute()
            
            logger.info(f"Successfully processed document {document_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to process document {document_id}: {e}")
            
            # Update status to failed
            try:
                self.supabase.table("rag_documents").update({
                    "processing_status": "failed"
                }).eq("id", document_id).execute()
            except:
                logger.error(f"Failed to update document status to failed")
            
            return False
    
    async def retrieve_context_simple(self, simulation_id: str, query: str, max_chunks: int = 3) -> Dict[str, Any]:
        """Simple context retrieval - for now returns mock data"""
        try:
            logger.info(f"Retrieving context for simulation {simulation_id}")
            
            # Get documents for this simulation
            docs_response = self.supabase.table("rag_documents").select("*").eq("simulation_id", simulation_id).eq("processing_status", "completed").execute()
            
            if not docs_response.data:
                return {
                    "context": "No documents found for this simulation.",
                    "chunks": [],
                    "total_chunks": 0
                }
            
            # For now, return basic info about available documents
            doc_count = len(docs_response.data)
            context = f"Found {doc_count} processed documents for this simulation. Document processing is working correctly."
            
            chunks = [
                {
                    "text": f"Document: {doc['filename']} (Size: {doc['file_size']} bytes)",
                    "metadata": {
                        "document_id": doc["id"],
                        "filename": doc["filename"],
                        "upload_date": doc["upload_date"]
                    },
                    "score": 0.9
                }
                for doc in docs_response.data[:max_chunks]
            ]
            
            result = {
                "context": context,
                "chunks": chunks,
                "total_chunks": len(chunks)
            }
            
            logger.info(f"Retrieved {len(chunks)} chunks for query")
            return result
            
        except Exception as e:
            logger.error(f"Failed to retrieve context: {e}")
            return {
                "context": "",
                "chunks": [],
                "total_chunks": 0
            }
    
    async def delete_document(self, simulation_id: str, document_id: str) -> bool:
        """Delete document from storage and database"""
        try:
            logger.info(f"Deleting document {document_id} from simulation {simulation_id}")
            
            # Get document info
            doc_response = self.supabase.table("rag_documents").select("storage_path").eq("id", document_id).execute()
            
            if not doc_response.data:
                logger.warning(f"Document {document_id} not found")
                return False
            
            storage_path = doc_response.data[0]["storage_path"]
            
            # Delete from storage
            self.supabase.storage.from_("rag-documents").remove([storage_path])
            
            # Delete from database
            self.supabase.table("rag_documents").delete().eq("id", document_id).execute()
            
            logger.info(f"Successfully deleted document {document_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete document {document_id}: {e}")
            return False

# Global instance with lazy initialization
_service_instance = None

def get_simple_rag_service():
    global _service_instance
    if _service_instance is None:
        _service_instance = SimpleRAGService()
    return _service_instance 