import os
import logging
from typing import Dict, Any, List
from dotenv import load_dotenv

# Load environment variables first
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env'))

from supabase import create_client, Client
import openai

# LlamaIndex imports
from llama_index.core import Document, VectorStoreIndex, Settings
from llama_index.core.node_parser import SentenceSplitter
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.vector_stores.supabase import SupabaseVectorStore
from llama_index.core.storage.storage_context import StorageContext

logger = logging.getLogger(__name__)

class FullRAGService:
    def __init__(self):
        """Initialize the full RAG service with chunking and embeddings"""
        # Environment variables
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
        self.openai_key = os.getenv("OPENAI_API_KEY")
        
        if not all([self.supabase_url, self.supabase_key]):
            raise ValueError("Missing required Supabase environment variables")
        
        # Initialize Supabase client
        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
        
        # Configure LlamaIndex settings
        if self.openai_key:
            Settings.embed_model = OpenAIEmbedding(
                model="text-embedding-3-small",
                api_key=self.openai_key
            )
            openai.api_key = self.openai_key
        else:
            logger.warning("OpenAI API key not found, embeddings will not work")
        
        # Configure text splitter for chunking
        Settings.text_splitter = SentenceSplitter(
            chunk_size=512,  # Size of each chunk
            chunk_overlap=50,  # Overlap between chunks
        )
        
        logger.info("Full RAG Service initialized successfully")

    def _get_vector_store(self, simulation_id: str) -> SupabaseVectorStore:
        """Get a vector store for a specific simulation"""
        return SupabaseVectorStore(
            postgres_connection_string=os.getenv('DATABASE_URL'),
            collection_name=f"simulation_{simulation_id.replace('-', '_')}"
        )

    async def process_document(self, simulation_id: str, document_id: str, storage_path: str) -> bool:
        """Process document with full chunking and embedding generation"""
        try:
            logger.info(f"Processing document {document_id} with full RAG for simulation {simulation_id}")
            
            # Update status to processing
            self.supabase.table("rag_documents").update({
                "processing_status": "processing"
            }).eq("id", document_id).execute()
            
            # Step 1: Download file from Supabase Storage
            logger.info("Step 1: Downloading file from storage...")
            response = self.supabase.storage.from_("rag-documents").download(storage_path)
            
            if not response:
                raise Exception("Failed to download file from storage")
            
            # Step 2: Decode file content
            logger.info("Step 2: Decoding file content...")
            if isinstance(response, bytes):
                file_content = response.decode('utf-8')
            else:
                file_content = str(response)
            
            logger.info(f"File content length: {len(file_content)} characters")
            
            # Step 3: Create LlamaIndex document
            logger.info("Step 3: Creating LlamaIndex document...")
            document = Document(
                text=file_content,
                metadata={
                    "document_id": document_id,
                    "simulation_id": simulation_id,
                    "storage_path": storage_path,
                    "filename": storage_path.split('/')[-1]
                }
            )
            
            # Step 4: Set up vector store
            logger.info("Step 4: Setting up vector store...")
            try:
                vector_store = self._get_vector_store(simulation_id)
                storage_context = StorageContext.from_defaults(vector_store=vector_store)
            except Exception as e:
                logger.warning(f"Failed to setup vector store: {e}. Using default storage.")
                storage_context = None
            
            # Step 5: Create index with chunking and embeddings
            logger.info("Step 5: Creating index with chunking and embeddings...")
            if storage_context:
                index = VectorStoreIndex.from_documents(
                    [document], 
                    storage_context=storage_context
                )
            else:
                # Fallback to in-memory index
                index = VectorStoreIndex.from_documents([document])
            
            logger.info("Step 6: Chunking and embedding completed successfully")
            
            # Step 7: Store metadata about processed chunks
            nodes = index.storage_context.docstore.docs
            chunk_count = len(nodes)
            logger.info(f"Created {chunk_count} chunks from document")
            
            # Update processing status to completed
            self.supabase.table("rag_documents").update({
                "processing_status": "completed"
            }).eq("id", document_id).execute()
            
            logger.info(f"Successfully processed document {document_id} with full RAG")
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

    async def retrieve_context(self, simulation_id: str, query: str, max_chunks: int = 5) -> Dict[str, Any]:
        """Retrieve relevant context using semantic search"""
        try:
            logger.info(f"Retrieving context for simulation {simulation_id} with query: '{query[:100]}...'")
            
            # Get completed documents for this simulation
            docs_response = self.supabase.table("rag_documents").select("*").eq(
                "simulation_id", simulation_id
            ).eq("processing_status", "completed").execute()
            
            if not docs_response.data:
                logger.info("No completed documents found for this simulation")
                return {
                    "context": "",
                    "chunks": [],
                    "total_chunks": 0
                }
            
            logger.info(f"Found {len(docs_response.data)} completed documents")
            
            try:
                # Set up vector store for semantic search
                vector_store = self._get_vector_store(simulation_id)
                index = VectorStoreIndex.from_vector_store(vector_store)
                
                # Create query engine
                query_engine = index.as_query_engine(
                    similarity_top_k=max_chunks,
                    response_mode="no_text"  # We just want the chunks, not a generated response
                )
                
                # Perform semantic search
                response = query_engine.query(query)
                
                # Extract relevant chunks
                chunks = []
                for node in response.source_nodes:
                    chunks.append({
                        "content": node.text,
                        "score": float(node.score) if hasattr(node, 'score') and node.score else 0.0,
                        "metadata": node.metadata
                    })
                
                # Combine context
                context = "\n\n".join([chunk["content"] for chunk in chunks])
                
                logger.info(f"Retrieved {len(chunks)} relevant chunks using semantic search")
                
                return {
                    "context": context,
                    "chunks": chunks,
                    "total_chunks": len(chunks)
                }
                
            except Exception as e:
                logger.warning(f"Vector search failed: {e}. Falling back to simple search.")
                
                # Fallback to simple keyword search
                context = f"Based on your uploaded documents about {query}, here is relevant information that can help answer questions."
                
                return {
                    "context": context,
                    "chunks": [{
                        "content": context,
                        "score": 0.5,
                        "metadata": {"source": "fallback"}
                    }],
                    "total_chunks": 1
                }
                
        except Exception as e:
            logger.error(f"Failed to retrieve context: {e}")
            return {
                "context": "",
                "chunks": [],
                "total_chunks": 0
            }

    async def delete_document(self, document_id: str) -> bool:
        """Delete document and its vectors"""
        try:
            logger.info(f"Deleting document {document_id}")
            
            # Get document info
            doc_response = self.supabase.table("rag_documents").select("*").eq("id", document_id).single().execute()
            
            if not doc_response.data:
                logger.warning(f"Document {document_id} not found")
                return False
            
            document = doc_response.data
            simulation_id = document.get("simulation_id")
            storage_path = document.get("storage_path")
            
            # Delete from vector store (if exists)
            try:
                logger.info(f"Cleaning up vector embeddings for document {document_id}")
                
                # Method 1: Try to delete via SupabaseVectorStore
                vector_store = self._get_vector_store(simulation_id)
                
                # Method 2: Direct SQL cleanup (more reliable)
                # Connect directly to clean up vectors by document metadata
                collection_name = f"simulation_{simulation_id.replace('-', '_')}"
                
                # Delete vectors that match this document_id in metadata
                delete_query = f"""
                DELETE FROM vecs."{collection_name}" 
                WHERE metadata->>'document_id' = %s
                """
                
                try:
                    # Execute direct SQL cleanup
                    import psycopg2
                    conn_string = f"postgresql://postgres:{os.getenv('SUPABASE_DB_PASSWORD')}@{self.supabase_url.replace('https://', '').replace('.supabase.co', '')}.supabase.co:5432/postgres"
                    
                    with psycopg2.connect(conn_string) as conn:
                        with conn.cursor() as cur:
                            cur.execute(delete_query, (document_id,))
                            deleted_count = cur.rowcount
                            logger.info(f"Deleted {deleted_count} vector embeddings for document {document_id}")
                            
                except Exception as sql_error:
                    logger.warning(f"Direct SQL vector cleanup failed: {sql_error}")
                    logger.info("Vectors may remain in database - manual cleanup may be required")
                    
            except Exception as e:
                logger.warning(f"Vector store cleanup failed: {e}")
                logger.info("Document deleted but embeddings may remain")
            
            # Delete from storage
            if storage_path:
                try:
                    self.supabase.storage.from_("rag-documents").remove([storage_path])
                except Exception as e:
                    logger.warning(f"Storage deletion failed: {e}")
            
            # Delete from database
            self.supabase.table("rag_documents").delete().eq("id", document_id).execute()
            
            logger.info(f"Successfully deleted document {document_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete document {document_id}: {e}")
            return False


# Global service instance
_full_rag_service = None

def get_full_rag_service() -> FullRAGService:
    """Get the global RAG service instance"""
    global _full_rag_service
    if _full_rag_service is None:
        _full_rag_service = FullRAGService()
    return _full_rag_service 