from typing import List, Dict, Optional, Union
from dataclasses import dataclass
import re
from fastapi import HTTPException

# LlamaIndex imports for text splitting
from llama_index.core.text_splitter import TokenTextSplitter
from llama_index.core.node_parser import SimpleNodeParser
from llama_index.core import Document
from llama_index.core.schema import BaseNode

import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


@dataclass
class ChunkMetadata:
    """Metadata for each text chunk"""
    chunk_id: str
    chunk_index: int
    total_chunks: int
    start_position: int
    end_position: int
    token_count: int
    word_count: int
    has_speaker_info: bool
    speakers: List[str]
    overlap_with_previous: bool
    overlap_with_next: bool

class TranscriptChunker:
    """Handle intelligent chunking of transcript text"""
    
    def __init__(
        self,
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
        separator: str = "\n\n"
    ):
        """
        Initialize the chunker with configurable parameters
        
        Args:
            chunk_size: Maximum tokens per chunk
            chunk_overlap: Number of tokens to overlap between chunks
            separator: Primary separator for splitting text
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.separator = separator
        
        # Initialize LlamaIndex text splitter
        self.text_splitter = TokenTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separator=separator
        )
        
        # Speaker detection patterns
        self.speaker_patterns = [
            r'^(Moderator|Participant \d+|Speaker \d+|[A-Z][a-z]+):',
            r'^([A-Z][A-Za-z\s]+):\s',
            r'^\[([A-Z][A-Za-z\s]+)\]:',
            r'^([A-Z]+):\s'
        ]
    
    def detect_speakers(self, text: str) -> List[str]:
        """Extract speaker names from text"""
        speakers = set()
        
        for pattern in self.speaker_patterns:
            matches = re.findall(pattern, text, re.MULTILINE)
            speakers.update(matches)
        
        return list(speakers)
    
    def has_speaker_information(self, text: str) -> bool:
        """Check if text contains speaker attribution"""
        for pattern in self.speaker_patterns:
            if re.search(pattern, text, re.MULTILINE):
                return True
        return False
    
    def create_chunks_from_text(self, text: str, study_id: str) -> List[Dict]:
        """Create intelligent chunks from transcript text"""
        try:
            # Create a Document object for LlamaIndex processing
            document = Document(text=text, metadata={"study_id": study_id})
            
            # Split text using LlamaIndex text splitter
            text_chunks = self.text_splitter.split_text(text)
            
            chunks_data = []
            
            for i, chunk_text in enumerate(text_chunks):
                # Generate chunk metadata
                chunk_metadata = self._create_chunk_metadata(
                    chunk_text=chunk_text,
                    chunk_index=i,
                    total_chunks=len(text_chunks),
                    original_text=text
                )
                
                # Create chunk data structure
                chunk_data = {
                    "chunk_id": f"{study_id}_chunk_{i:03d}",
                    "study_id": study_id,
                    "chunk_index": i,
                    "text": chunk_text,
                    "metadata": {
                        "token_count": chunk_metadata.token_count,
                        "word_count": chunk_metadata.word_count,
                        "has_speaker_info": chunk_metadata.has_speaker_info,
                        "speakers": chunk_metadata.speakers,
                        "start_position": chunk_metadata.start_position,
                        "end_position": chunk_metadata.end_position,
                        "overlap_with_previous": chunk_metadata.overlap_with_previous,
                        "overlap_with_next": chunk_metadata.overlap_with_next,
                        "total_chunks": chunk_metadata.total_chunks
                    }
                }
                
                chunks_data.append(chunk_data)
            
            return chunks_data
            
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Chunking failed: {str(e)}"
            )
    
    def _create_chunk_metadata(
        self, 
        chunk_text: str, 
        chunk_index: int, 
        total_chunks: int,
        original_text: str
    ) -> ChunkMetadata:
        """Create detailed metadata for a chunk"""
        
        # Calculate positions in original text
        start_pos = original_text.find(chunk_text[:50])  # Use first 50 chars to find position
        end_pos = start_pos + len(chunk_text) if start_pos != -1 else len(chunk_text)
        
        # Count tokens (approximate using word count * 1.3)
        word_count = len(chunk_text.split())
        token_count = int(word_count * 1.3)  # Rough token estimation
        
        # Detect speakers
        speakers = self.detect_speakers(chunk_text)
        has_speaker_info = self.has_speaker_information(chunk_text)
        
        # Determine overlap status
        overlap_with_previous = chunk_index > 0
        overlap_with_next = chunk_index < total_chunks - 1
        
        return ChunkMetadata(
            chunk_id=f"chunk_{chunk_index:03d}",
            chunk_index=chunk_index,
            total_chunks=total_chunks,
            start_position=start_pos if start_pos != -1 else 0,
            end_position=end_pos,
            token_count=token_count,
            word_count=word_count,
            has_speaker_info=has_speaker_info,
            speakers=speakers,
            overlap_with_previous=overlap_with_previous,
            overlap_with_next=overlap_with_next
        )
    
    def chunk_study_content(self, study_id: str, text_content: str) -> Dict:
        """Process all content for a study and return chunked data"""
        try:
            # Create chunks from the combined text
            chunks = self.create_chunks_from_text(text_content, study_id)
            
            # Generate summary statistics
            total_tokens = sum(chunk["metadata"]["token_count"] for chunk in chunks)
            total_words = sum(chunk["metadata"]["word_count"] for chunk in chunks)
            chunks_with_speakers = sum(1 for chunk in chunks if chunk["metadata"]["has_speaker_info"])
            
            # Collect all unique speakers
            all_speakers = set()
            for chunk in chunks:
                all_speakers.update(chunk["metadata"]["speakers"])
            logger.info(f"All chunnkss222: {chunks}")
            return {
                "study_id": study_id,
                "chunking_summary": {
                    "total_chunks": len(chunks),
                    "total_tokens": total_tokens,
                    "total_words": total_words,
                    "chunks_with_speakers": chunks_with_speakers,
                    "unique_speakers": list(all_speakers),
                    "average_chunk_size": total_tokens // len(chunks) if chunks else 0,
                    "chunk_size_config": self.chunk_size,
                    "chunk_overlap_config": self.chunk_overlap
                },
                "chunks": chunks
            }
            
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Study chunking failed: {str(e)}"
            )
    
    def get_chunk_by_index(self, chunks_data: Dict, chunk_index: int) -> Optional[Dict]:
        """Retrieve a specific chunk by index"""
        chunks = chunks_data.get("chunks", [])
        
        if 0 <= chunk_index < len(chunks):
            return chunks[chunk_index]
        
        return None
    
    def get_chunks_with_speaker(self, chunks_data: Dict, speaker_name: str) -> List[Dict]:
        """Get all chunks containing a specific speaker"""
        matching_chunks = []
        
        for chunk in chunks_data.get("chunks", []):
            if speaker_name in chunk["metadata"]["speakers"]:
                matching_chunks.append(chunk)
        
        return matching_chunks

# Create global instance
transcript_chunker = TranscriptChunker(
    chunk_size=1000,    # Optimal for most LLMs
    chunk_overlap=200,  # Good context preservation
    separator="\n\n"    # Paragraph-based splitting
)
