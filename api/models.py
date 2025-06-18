from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from enum import Enum

# Enums for validation
class AnalysisStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class FileType(str, Enum):
    PDF = "pdf"
    DOCX = "docx"
    TXT = "txt"

# Request Models
class StudyMetadata(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    moderator: Optional[str] = Field(None, max_length=100)
    location: Optional[str] = Field(None, max_length=100)
    date: Optional[str] = None
    participant_count: Optional[int] = Field(None, ge=1, le=50)
    demographics: Optional[str] = Field(None, max_length=500)
    
class FileUploadInfo(BaseModel):
    filename: str
    file_type: FileType
    file_size: int

# Response Models
class UploadResponse(BaseModel):
    study_id: str
    message: str
    files_uploaded: int
    status: AnalysisStatus
    created_at: datetime
    
class ErrorResponse(BaseModel):
    error: str
    details: Optional[str] = None
    
class StatusResponse(BaseModel):
    study_id: str
    status: AnalysisStatus
    progress: Optional[int] = None
    message: Optional[str] = None
    created_at: datetime
    updated_at: datetime
