from typing import TypedDict, List, Optional, Dict, Any

class DocumentMetadata(TypedDict):
    document_id: str
    file_name: str
    file_type: str
    page_count: Optional[int]
    additional_metadata: Optional[Dict[str, Any]]

class Chunk(TypedDict):
    text: str
    metadata: DocumentMetadata

class ChunkRequest(TypedDict):
    document_id: str
    text: str
    metadata: DocumentMetadata

class ChunkResponse(TypedDict):
    chunks: List[Chunk]
    error: Optional[str]
