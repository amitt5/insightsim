import os
from pathlib import Path
from typing import List, Dict, Optional, Union
from fastapi import HTTPException

# LlamaIndex imports for document processing
from llama_index.core import SimpleDirectoryReader, Document
from llama_index.readers.file import PDFReader, DocxReader
from llama_index.core.readers.base import BaseReader

# Import your models
from models import FileType

class DocumentProcessor:
    """Handle document processing for different file types"""
    
    def __init__(self):
        self.pdf_reader = PDFReader()
        self.docx_reader = DocxReader()
        
    def get_file_type(self, file_path: str) -> FileType:
        """Determine file type from extension"""
        extension = Path(file_path).suffix.lower()
        
        type_mapping = {
            '.pdf': FileType.PDF,
            '.docx': FileType.DOCX,
            '.txt': FileType.TXT
        }
        
        if extension not in type_mapping:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {extension}"
            )
        
        return type_mapping[extension]
    
    def extract_text_from_file(self, file_path: str) -> Dict[str, Union[str, int]]:
        """Extract text content from a single file"""
        try:
            if not os.path.exists(file_path):
                raise HTTPException(
                    status_code=404,
                    detail=f"File not found: {file_path}"
                )
            
            file_type = self.get_file_type(file_path)
            
            # Use appropriate reader based on file type
            if file_type == FileType.PDF:
                documents = self.pdf_reader.load_data(file=Path(file_path))
            elif file_type == FileType.DOCX:
                documents = self.docx_reader.load_data(file=Path(file_path))
            elif file_type == FileType.TXT:
                # Use SimpleDirectoryReader for text files
                reader = SimpleDirectoryReader(
                    input_files=[file_path],
                    filename_as_id=True
                )
                documents = reader.load_data()
            else:
                raise HTTPException(
                    status_code=400,
                    detail=f"Unsupported file type: {file_type}"
                )
            
            # Extract text content from documents
            text_content = ""
            for doc in documents:
                text_content += doc.text + "\n\n"
            
            # Clean up text content
            cleaned_text = self.clean_text(text_content)
            
            return {
                "file_path": file_path,
                "file_type": file_type.value,
                "text_content": cleaned_text,
                "character_count": len(cleaned_text),
                "word_count": len(cleaned_text.split()),
                "page_count": len(documents)
            }
            
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error processing file {file_path}: {str(e)}"
            )
    
    def clean_text(self, text: str) -> str:
        """Clean and normalize extracted text"""
        # Remove excessive whitespace
        cleaned = " ".join(text.split())
        
        # Remove empty lines and normalize line breaks
        lines = [line.strip() for line in cleaned.split('\n') if line.strip()]
        cleaned = '\n'.join(lines)
        
        return cleaned
    
    def process_study_files(self, study_id: str, upload_dir: str = "uploads") -> List[Dict]:
        """Process all files for a study"""
        study_path = Path(upload_dir) / study_id
        
        if not study_path.exists():
            raise HTTPException(
                status_code=404,
                detail=f"Study directory not found: {study_id}"
            )
        
        processed_files = []
        
        # Process each file in the study directory
        for file_path in study_path.glob("*"):
            if file_path.is_file():
                try:
                    file_data = self.extract_text_from_file(str(file_path))
                    processed_files.append(file_data)
                except HTTPException as e:
                    # Log error but continue processing other files
                    print(f"Error processing {file_path}: {e.detail}")
                    continue
        
        if not processed_files:
            raise HTTPException(
                status_code=400,
                detail=f"No processable files found for study: {study_id}"
            )
        
        return processed_files
    
    def get_study_text_summary(self, study_id: str) -> Dict[str, Union[str, int]]:
        """Get summary statistics for all text in a study"""
        processed_files = self.process_study_files(study_id)
        
        total_characters = sum(file_data["character_count"] for file_data in processed_files)
        total_words = sum(file_data["word_count"] for file_data in processed_files)
        total_pages = sum(file_data["page_count"] for file_data in processed_files)
        
        # Combine all text content
        combined_text = "\n\n--- FILE SEPARATOR ---\n\n".join(
            file_data["text_content"] for file_data in processed_files
        )
        
        return {
            "study_id": study_id,
            "file_count": len(processed_files),
            "total_characters": total_characters,
            "total_words": total_words,
            "total_pages": total_pages,
            "combined_text": combined_text,
            "files_processed": [
                {
                    "file_path": file_data["file_path"],
                    "file_type": file_data["file_type"],
                    "word_count": file_data["word_count"]
                }
                for file_data in processed_files
            ]
        }

# Create global instance
document_processor = DocumentProcessor()
