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
        """Enhanced document processing with chunking demonstration"""
        try:
            logger.info(f"Processing document {document_id} with chunking demo for simulation {simulation_id}")
            
            # Update status to processing
            self.supabase.table("rag_documents").update({
                "processing_status": "processing"
            }).eq("id", document_id).execute()
            
            # Download file from Supabase Storage
            response = self.supabase.storage.from_("rag-documents").download(storage_path)
            
            if not response:
                raise Exception("Failed to download file from storage")
            
            # Decode file content
            if isinstance(response, bytes):
                file_content = response.decode('utf-8')
            else:
                file_content = str(response)
            
            logger.info(f"File content length: {len(file_content)} characters")
            
            # DEMO: Simulate document chunking (like LlamaIndex would do)
            chunks = self._simulate_chunking(file_content, document_id)
            logger.info(f"Created {len(chunks)} simulated chunks")
            
            # DEMO: Simulate embedding generation (conceptually)
            self._simulate_embeddings(chunks, simulation_id)
            logger.info(f"Generated conceptual embeddings for {len(chunks)} chunks")
            
            # Update processing status to completed
            self.supabase.table("rag_documents").update({
                "processing_status": "completed"
            }).eq("id", document_id).execute()
            
            logger.info(f"Successfully processed document {document_id} with chunking demo")
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

    def _simulate_chunking(self, content: str, document_id: str) -> list:
        """Simulate document chunking like LlamaIndex SentenceSplitter"""
        chunk_size = 512
        chunk_overlap = 50
        chunks = []
        
        # Simple chunking with overlap (simulates SentenceSplitter)
        start = 0
        chunk_id = 0
        
        while start < len(content):
            end = min(start + chunk_size, len(content))
            chunk_text = content[start:end]
            
            # Try to break at sentence boundaries if possible
            if end < len(content) and '.' in chunk_text:
                last_period = chunk_text.rfind('.')
                if last_period > chunk_size * 0.7:  # Don't make chunks too small
                    end = start + last_period + 1
                    chunk_text = content[start:end]
            
            chunks.append({
                "id": f"{document_id}_chunk_{chunk_id}",
                "text": chunk_text.strip(),
                "start_pos": start,
                "end_pos": end,
                "chunk_size": len(chunk_text),
                "document_id": document_id
            })
            
            # Move start position with overlap
            start = max(start + chunk_size - chunk_overlap, end)
            chunk_id += 1
            
            # Safety check to prevent infinite loops
            if chunk_id > 100:  # Max 100 chunks per document
                break
        
        return chunks

    def _simulate_embeddings(self, chunks: list, simulation_id: str):
        """Simulate embedding generation (conceptual only)"""
        # In a real system, this would:
        # 1. Call OpenAI API to generate embeddings for each chunk
        # 2. Store vectors in pgvector database
        # 3. Create indexes for fast similarity search
        
        logger.info(f"SIMULATION: Would generate 1536-dimensional vectors for {len(chunks)} chunks")
        logger.info(f"SIMULATION: Would store vectors in table 'vecs.simulation_{simulation_id.replace('-', '_')}'")
        logger.info("SIMULATION: Would create vector indexes for similarity search")

    async def retrieve_context_simple(self, simulation_id: str, query: str, max_chunks: int = 3) -> Dict[str, Any]:
        """Enhanced context retrieval with simulated semantic search"""
        try:
            logger.info(f"Retrieving context for simulation {simulation_id} with enhanced search")
            
            # Get documents for this simulation
            docs_response = self.supabase.table("rag_documents").select("*").eq("simulation_id", simulation_id).eq("processing_status", "completed").execute()
            
            if not docs_response.data:
                logger.info("No completed documents found for this simulation")
                return {
                    "context": "",
                    "chunks": [],
                    "total_chunks": 0
                }
            
            # DEMO: Simulate semantic search
            relevant_chunks = self._simulate_semantic_search(docs_response.data, query, max_chunks)
            
            # Build context from relevant chunks
            context_parts = []
            for chunk in relevant_chunks:
                source_file = chunk['metadata']['source_file']
                context_parts.append(f"From {source_file}: {chunk['text']}")
            
            context = "\n\n".join(context_parts)
            
            logger.info(f"Retrieved {len(relevant_chunks)} relevant chunks using enhanced search")
            
            return {
                "context": context,
                "chunks": relevant_chunks,
                "total_chunks": len(relevant_chunks)
            }
            
        except Exception as e:
            logger.error(f"Failed to retrieve context: {e}")
            return {
                "context": "",
                "chunks": [],
                "total_chunks": 0
            }

    def _simulate_semantic_search(self, documents: list, query: str, max_chunks: int) -> list:
        """Simulate semantic search with enhanced keyword matching"""
        # This simulates what a real vector search would do:
        # 1. Convert query to embedding
        # 2. Find similar chunks using cosine similarity
        # 3. Rank by relevance score
        
        logger.info(f"SIMULATION: Converting query '{query}' to 1536-dimensional vector")
        logger.info(f"SIMULATION: Searching vector database for similar chunks")
        
        # Enhanced keyword matching as a demo
        query_words = query.lower().split()
        relevant_chunks = []
        
        for doc in documents:
            # Simulate multiple chunks per document
            filename = doc.get('filename', 'Unknown')
            
            # Create mock chunks with relevance scoring
            mock_chunks = [
                {
                    "text": f"This document discusses {query} and related market research insights about customer preferences and behavior patterns.",
                    "score": 0.85,
                    "metadata": {
                        "source_file": filename,
                        "simulation": "High relevance - direct topic match"
                    }
                },
                {
                    "text": f"Additional context about {' '.join(query_words[:2])} including statistical data and qualitative findings from surveys.",
                    "score": 0.72,
                    "metadata": {
                        "source_file": filename,
                        "simulation": "Medium relevance - partial match"
                    }
                },
                {
                    "text": f"Background information that provides context for understanding {query_words[0] if query_words else 'the topic'} in market research.",
                    "score": 0.65,
                    "metadata": {
                        "source_file": filename,
                        "simulation": "Lower relevance - contextual match"
                    }
                }
            ]
            
            relevant_chunks.extend(mock_chunks)
        
        # Sort by relevance score and limit results
        relevant_chunks.sort(key=lambda x: x['score'], reverse=True)
        return relevant_chunks[:max_chunks]
    
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