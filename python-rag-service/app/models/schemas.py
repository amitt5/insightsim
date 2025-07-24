from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class ProcessDocumentRequest(BaseModel):
    simulation_id: str
    document_id: str
    storage_path: str

class RAGQueryRequest(BaseModel):
    simulation_id: str
    query: str
    max_chunks: Optional[int] = 3

class DocumentStatusResponse(BaseModel):
    status: str
    message: Optional[str] = None

class ContextChunk(BaseModel):
    text: str
    metadata: Dict[str, Any]
    score: Optional[float] = None

class RAGQueryResponse(BaseModel):
    context: str
    chunks: List[ContextChunk]
    total_chunks: int

class ProcessingResponse(BaseModel):
    status: str
    message: str
    document_id: Optional[str] = None 