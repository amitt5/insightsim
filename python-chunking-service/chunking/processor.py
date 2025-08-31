from typing import List
from .types import Chunk, DocumentMetadata
from config import CHUNK_SIZE, CHUNK_OVERLAP

def process_document(text: str, metadata: DocumentMetadata) -> List[Chunk]:
    """
    Process a document using simple word-based chunking
    
    Args:
        text: The document text to chunk
        metadata: Document metadata to include with each chunk
    
    Returns:
        List of chunks with metadata
    """
    try:
        print("Starting document processing...")
        # Split into sentences (simple approach)
        sentences = text.replace('!', '.').replace('?', '.').split('.')
        sentences = [s.strip() for s in sentences if s.strip()]
        
        chunks: List[Chunk] = []
        current_chunk = []
        current_length = 0
        
        print(f"Processing {len(sentences)} sentences...")
        
        for sentence in sentences:
            sentence_length = len(sentence)
            
            # If adding this sentence would exceed CHUNK_SIZE, create a new chunk
            if current_length + sentence_length > CHUNK_SIZE and current_chunk:
                chunk_text = ' '.join(current_chunk)
                chunk_metadata = {
                    **metadata,
                    "chunk_index": len(chunks),
                    "start_token": sum(len(c) for c in chunks),
                    "end_token": sum(len(c) for c in chunks) + len(chunk_text),
                    "total_chunks": None  # Will update after all chunks are created
                }
                
                chunks.append({
                    "text": chunk_text,
                    "metadata": chunk_metadata
                })
                
                # Start new chunk, considering overlap
                overlap_tokens = current_chunk[-1:] if CHUNK_OVERLAP > 0 else []
                current_chunk = overlap_tokens + [sentence]
                current_length = sum(len(s) for s in current_chunk)
            else:
                current_chunk.append(sentence)
                current_length += sentence_length
        
        # Add the last chunk if there's anything left
        if current_chunk:
            chunk_text = ' '.join(current_chunk)
            chunk_metadata = {
                **metadata,
                "chunk_index": len(chunks),
                "start_token": sum(len(c) for c in chunks),
                "end_token": sum(len(c) for c in chunks) + len(chunk_text),
                "total_chunks": None
            }
            
            chunks.append({
                "text": chunk_text,
                "metadata": chunk_metadata
            })
        
        # Update total chunks in metadata
        for chunk in chunks:
            chunk["metadata"]["total_chunks"] = len(chunks)
        
        print(f"Created {len(chunks)} chunks")
        return chunks
    
    except Exception as e:
        print(f"Error processing document: {str(e)}")
        raise
