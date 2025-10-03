from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any
import PyPDF2
import io
import os
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(title="PDF Text Extraction Service", version="1.0.0")

# CORS configuration
origins = [
    os.getenv("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),
    "http://localhost:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Response models
class HealthResponse(BaseModel):
    status: str
    message: str

class TextExtractionResponse(BaseModel):
    success: bool
    message: str
    extracted_text: str
    filename: str
    file_size: int
    pages_count: int
    text_length: int

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        message="PDF Text Extraction Service is running"
    )

def extract_text_from_pdf(file_content: bytes) -> Dict[str, Any]:
    """Extract text from PDF file content using PyPDF2"""
    try:
        print("🔍 [PDF EXTRACTION] Starting PDF text extraction...")
        logger.info("Starting PDF text extraction")
        
        # Create a BytesIO object from the file content
        pdf_file = io.BytesIO(file_content)
        print(f"📄 [PDF EXTRACTION] File size: {len(file_content)} bytes")
        
        # Create PDF reader
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        
        # Extract text from all pages
        extracted_text = ""
        total_pages = len(pdf_reader.pages)
        
        print(f"📖 [PDF EXTRACTION] Processing PDF with {total_pages} pages")
        logger.info(f"Processing PDF with {total_pages} pages")
        
        for page_num, page in enumerate(pdf_reader.pages):
            try:
                print(f"📝 [PDF EXTRACTION] Extracting text from page {page_num + 1}/{total_pages}...")
                page_text = page.extract_text()
                if page_text:
                    page_length = len(page_text)
                    print(f"✅ [PDF EXTRACTION] Page {page_num + 1}: {page_length} characters extracted")
                    extracted_text += f"\n--- Page {page_num + 1} ---\n"
                    extracted_text += page_text
                    extracted_text += "\n"
                else:
                    print(f"⚠️  [PDF EXTRACTION] Page {page_num + 1}: No text found")
            except Exception as e:
                print(f"❌ [PDF EXTRACTION] Error on page {page_num + 1}: {e}")
                logger.warning(f"Error extracting text from page {page_num + 1}: {e}")
                continue
        
        if not extracted_text.strip():
            print("❌ [PDF EXTRACTION] No text could be extracted from the PDF")
            raise ValueError("No text could be extracted from the PDF")
        
        total_chars = len(extracted_text)
        print(f"🎉 [PDF EXTRACTION] Successfully extracted {total_chars} characters from PDF")
        print(f"📊 [PDF EXTRACTION] Preview of extracted text (first 200 chars):")
        print(f"   {extracted_text[:200]}...")
        logger.info(f"Successfully extracted {len(extracted_text)} characters from PDF")
        
        return {
            "extracted_text": extracted_text.strip(),
            "pages_count": total_pages,
            "text_length": total_chars
        }
        
    except Exception as e:
        print(f"💥 [PDF EXTRACTION] Error extracting text from PDF: {e}")
        logger.error(f"Error extracting text from PDF: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to extract text from PDF: {str(e)}")

@app.post("/extract-text", response_model=TextExtractionResponse)
async def extract_text_endpoint(file: UploadFile = File(...)):
    """Extract text from uploaded PDF file"""
    try:
        print(f"📁 [API] Received file: {file.filename}")
        print(f"📁 [API] File size: {file.size} bytes")
        print(f"📁 [API] Content type: {file.content_type}")
        
        # Validate file type
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
        # Read file content
        file_content = await file.read()
        
        # Extract text
        result = extract_text_from_pdf(file_content)
        
        print(f"✅ [API] Text extraction completed successfully")
        
        return TextExtractionResponse(
            success=True,
            message="Text extracted successfully",
            extracted_text=result["extracted_text"],
            filename=file.filename,
            file_size=len(file_content),
            pages_count=result["pages_count"],
            text_length=result["text_length"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"💥 [API] Unexpected error: {e}")
        logger.error(f"Unexpected error in extract_text_endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
