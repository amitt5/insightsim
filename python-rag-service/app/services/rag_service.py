from llama_index.core import VectorStoreIndex, Document, StorageContext
from llama_index.vector_stores.supabase import SupabaseVectorStore
import os
from supabase import create_client, Client
from typing import List, Optional, Dict, Any
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RAGService:
    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
        self.database_url = os.getenv("DATABASE_URL")
        
        if not all([self.supabase_url, self.supabase_key, self.database_url]):
            raise ValueError("Missing required environment variables")
        
        # Initialize Supabase client
        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
        
        logger.info("RAG Service initialized successfully")
        
    def get_vector_store(self, simulation_id: str) -> SupabaseVectorStore:
        """Get SupabaseVectorStore for a specific simulation"""
        try:
            vector_store = SupabaseVectorStore(
                postgres_connection_string=self.database_url,
                collection_name=f"simulation_{simulation_id}",
                dimension=1536,  # OpenAI embedding dimension
            )
            logger.info(f"Vector store created for simulation: {simulation_id}")
            return vector_store
        except Exception as e:
            logger.error(f"Failed to create vector store: {e}")
            raise
    
    def get_index(self, simulation_id: str) -> VectorStoreIndex:
        """Get or create VectorStoreIndex for a simulation"""
        try:
            vector_store = self.get_vector_store(simulation_id)
            storage_context = StorageContext.from_defaults(vector_store=vector_store)
            
            # Try to load existing index or create new one
            try:
                index = VectorStoreIndex.from_vector_store(vector_store, storage_context=storage_context)
                logger.info(f"Loaded existing index for simulation: {simulation_id}")
            except:
                index = VectorStoreIndex([], storage_context=storage_context)
                logger.info(f"Created new index for simulation: {simulation_id}")
            
            return index
        except Exception as e:
            logger.error(f"Failed to get index: {e}")
            raise
    
    async def add_document(self, simulation_id: str, document_id: str, storage_path: str) -> bool:
        """Download document from Supabase Storage and add to index"""
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
            
            # Create Document object
            document = Document(
                text=file_content,
                metadata={
                    "document_id": document_id,
                    "simulation_id": simulation_id,
                    "storage_path": storage_path
                }
            )
            
            # Get index and add document
            index = self.get_index(simulation_id)
            index.insert(document)
            
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
    
    def create_query_engine(self, simulation_id: str, similarity_top_k: int = 3):
        """Create query engine for RAG queries"""
        try:
            index = self.get_index(simulation_id)
            
            # Create retriever
            retriever = VectorIndexRetriever(
                index=index,
                similarity_top_k=similarity_top_k,
            )
            
            # Create query engine
            query_engine = RetrieverQueryEngine(retriever=retriever)
            
            logger.info(f"Created query engine for simulation: {simulation_id}")
            return query_engine
            
        except Exception as e:
            logger.error(f"Failed to create query engine: {e}")
            raise
    
    async def retrieve_context(self, simulation_id: str, query: str, max_chunks: int = 3) -> Dict[str, Any]:
        """Retrieve relevant context for a query"""
        try:
            logger.info(f"Retrieving context for simulation {simulation_id}")
            
            # Create query engine
            query_engine = self.create_query_engine(simulation_id, similarity_top_k=max_chunks)
            
            # Query for relevant context
            response = query_engine.query(query)
            
            # Format response
            chunks = []
            if hasattr(response, 'source_nodes'):
                for node in response.source_nodes:
                    chunks.append({
                        "text": node.text,
                        "metadata": node.metadata,
                        "score": getattr(node, 'score', None)
                    })
            
            context = str(response) if response else ""
            
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
        """Delete document from index and storage"""
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
            
            # Note: LlamaIndex doesn't have direct delete by metadata yet
            # This is a known limitation that may need manual vector cleanup
            
            logger.info(f"Successfully deleted document {document_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete document {document_id}: {e}")
            return False

# Global instance
rag_service = RAGService() 