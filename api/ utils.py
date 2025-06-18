import os
import uuid
from pathlib import Path
from typing import List, Tuple
from fastapi import UploadFile, HTTPException
from models import FileType, FileUploadInfo

# Configuration
UPLOAD_DIR = "uploads"
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}

def create_upload_directory():
    """Create upload directory if it doesn't exist"""
    Path(UPLOAD_DIR).mkdir(exist_ok=True)

def generate_study_id() -> str:
    """Generate unique study ID"""
    return str(uuid.uuid4())

def validate_file(file: UploadFile) -> FileUploadInfo:
    """Validate uploaded file and return file info"""
    # Check file extension
    file_extension = Path(file.filename).suffix.lower()
    if file_extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"File type {file_extension} not supported. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Determine file type
    file_type_map = {".pdf": FileType.PDF, ".docx": FileType.DOCX, ".txt": FileType.TXT}
    file_type = file_type_map[file_extension]
    
    # Check file size (approximate, will be exact after reading)
    if hasattr(file, 'size') and file.size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File {file.filename} is too large. Maximum size: {MAX_FILE_SIZE / (1024*1024):.1f}MB"
        )
    
    return FileUploadInfo(
        filename=file.filename,
        file_type=file_type,
        file_size=file.size or 0
    )

async def save_uploaded_file(file: UploadFile, study_id: str) -> str:
    """Save uploaded file and return file path"""
    create_upload_directory()
    
    # Create study-specific directory
    study_dir = Path(UPLOAD_DIR) / study_id
    study_dir.mkdir(exist_ok=True)
    
    # Generate safe filename
    safe_filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = study_dir / safe_filename
    
    # Save file
    content = await file.read()
    
    # Final size check
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File {file.filename} is too large. Maximum size: {MAX_FILE_SIZE / (1024*1024):.1f}MB"
        )
    
    with open(file_path, "wb") as f:
        f.write(content)
    
    return str(file_path)
