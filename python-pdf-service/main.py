from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List
import PyPDF2
import io
import os
from dotenv import load_dotenv
import logging
# from llama_index.node_parser import SentenceSplitter
# from llama_index.schema import Document
import openai

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize OpenAI client
openai_client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

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

class ChunkResponse(BaseModel):
    text: str
    metadata: Dict[str, Any]
    embedding: List[float]

class ChunkingResponse(BaseModel):
    success: bool
    message: str
    chunks: List[ChunkResponse]
    filename: str
    total_chunks: int
    avg_chunk_size: int

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

def create_text_chunks(text: str, filename: str) -> List[Dict[str, Any]]:
    """Create text chunks using basic text splitting"""
    try:
        print("🔪 [CHUNKING] Starting text chunking...")
        logger.info(f"Starting text chunking for: {filename}")
        print(f"📝 [CHUNKING] Original text length: {len(text)} characters")
        
        # Basic text chunking parameters
        chunk_size = 512  # characters (similar to 512 tokens)
        chunk_overlap = 50  # characters (similar to 50 tokens)
        
        # Split text into chunks
        chunks = []
        start = 0
        chunk_index = 0
        
        while start < len(text):
            # Calculate end position
            end = start + chunk_size
            
            # If we're not at the end of the text, try to find a good break point
            if end < len(text):
                # Look for sentence endings within the last 100 characters
                search_start = max(start + chunk_size - 100, start)
                sentence_endings = [".", "!", "?", "\n\n"]
                
                best_break = end
                for ending in sentence_endings:
                    # Find the last occurrence of this ending
                    last_ending = text.rfind(ending, search_start, end)
                    if last_ending > search_start:
                        best_break = last_ending + len(ending)
                        break
                
                end = best_break
            else:
                end = len(text)
            
            # Extract chunk text
            chunk_text = text[start:end].strip()
            
            if chunk_text:  # Only add non-empty chunks
                chunk_metadata = {
                    "filename": filename,
                    "chunk_index": chunk_index,
                    "chunk_start": start,
                    "chunk_end": end,
                    "chunk_size": len(chunk_text),
                    "estimated_tokens": len(chunk_text.split()),  # Rough token estimation
                    "chunk_type": "text",
                    "processing_method": "basic_splitter"
                }
                
                chunks.append({
                    "text": chunk_text,
                    "metadata": chunk_metadata
                })
                
                chunk_index += 1
            
            # Move start position with overlap
            start = end - chunk_overlap
            if start >= len(text):
                break
        
        print(f"✅ [CHUNKING] Created {len(chunks)} text chunks")
        if chunks:
            avg_size = sum(len(chunk["text"]) for chunk in chunks) / len(chunks)
            print(f"📊 [CHUNKING] Average chunk size: {avg_size:.0f} characters")
        
        return chunks
        
    except Exception as e:
        print(f"💥 [CHUNKING] Error creating text chunks: {e}")
        logger.error(f"Error creating text chunks: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create text chunks: {str(e)}")

async def generate_embeddings_for_chunks(chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Generate OpenAI embeddings for text chunks"""
    try:
        print("🤖 [EMBEDDINGS] Starting embeddings generation...")
        logger.info(f"Generating embeddings for {len(chunks)} chunks")
        
        chunks_with_embeddings = []
        
        for i, chunk in enumerate(chunks):
            try:
                print(f"🧠 [EMBEDDINGS] Generating embedding for chunk {i+1}/{len(chunks)}...")
                
                # Generate embedding using OpenAI API
                response = openai_client.embeddings.create(
                    model="text-embedding-ada-002",
                    input=chunk["text"]
                )
                
                embedding = response.data[0].embedding
                
                # Add embedding to chunk
                chunk_with_embedding = {
                    "text": chunk["text"],
                    "metadata": chunk["metadata"],
                    "embedding": embedding
                }
                
                chunks_with_embeddings.append(chunk_with_embedding)
                
                print(f"✅ [EMBEDDINGS] Chunk {i+1}: {len(embedding)}-dimensional embedding generated")
                
            except Exception as e:
                print(f"❌ [EMBEDDINGS] Error generating embedding for chunk {i+1}: {e}")
                logger.warning(f"Error generating embedding for chunk {i+1}: {e}")
                # Continue with other chunks even if one fails
                continue
        
        print(f"🎉 [EMBEDDINGS] Successfully generated embeddings for {len(chunks_with_embeddings)} chunks")
        return chunks_with_embeddings
        
    except Exception as e:
        print(f"💥 [EMBEDDINGS] Error generating embeddings: {e}")
        logger.error(f"Error generating embeddings: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate embeddings: {str(e)}")

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

# COMMENTED OUT - Original chunking implementation for CAG approach
# @app.post("/chunk-text", response_model=ChunkingResponse)
# async def chunk_text_endpoint(file: UploadFile = File(...)):
#     """Extract text from PDF and create chunks using LlamaIndex"""
#     try:
#         print(f"📁 [CHUNK API] Received file: {file.filename}")
#         print(f"📁 [CHUNK API] File size: {file.size} bytes")
#         print(f"📁 [CHUNK API] Content type: {file.content_type}")
#         
#         # Validate file type
#         if not file.filename.lower().endswith('.pdf'):
#             raise HTTPException(status_code=400, detail="Only PDF files are supported")
#         
#         # Read file content
#         file_content = await file.read()
#         
#         # Step 1: Extract text
#         print("🔍 [CHUNK API] Step 1: Extracting text from PDF...")
#         text_result = extract_text_from_pdf(file_content)
#         extracted_text = text_result["extracted_text"]
#         
#         # Step 2: Create chunks
#         print("🔪 [CHUNK API] Step 2: Creating text chunks...", extracted_text[:100])
#         chunks = create_text_chunks(extracted_text, file.filename)
#         
#         # Step 3: Generate embeddings
#         print("🤖 [CHUNK API] Step 3: Generating embeddings...")
#         chunks_with_embeddings = await generate_embeddings_for_chunks(chunks)
#         
#         # Calculate average chunk size
#         avg_chunk_size = sum(len(chunk["text"]) for chunk in chunks_with_embeddings) / len(chunks_with_embeddings) if chunks_with_embeddings else 0
#         
#         print(f"✅ [CHUNK API] Processing completed successfully")
#         print(f"📊 [CHUNK API] Results: {len(chunks_with_embeddings)} chunks with embeddings, avg size: {avg_chunk_size:.0f} chars")
#         
#         return ChunkingResponse(
#             success=True,
#             message="Text extracted, chunked, and embeddings generated successfully",
#             chunks=[ChunkResponse(text=chunk["text"], metadata=chunk["metadata"], embedding=chunk["embedding"]) for chunk in chunks_with_embeddings],
#             filename=file.filename,
#             total_chunks=len(chunks_with_embeddings),
#             avg_chunk_size=int(avg_chunk_size)
#         )
#         
#     except HTTPException:
#         raise
#     except Exception as e:
#         print(f"💥 [CHUNK API] Unexpected error: {e}")
#         logger.error(f"Unexpected error in chunk_text_endpoint: {e}")
#         raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# NEW CAG APPROACH - Extract text only, no chunking
@app.post("/extract-for-cag", response_model=ChunkingResponse)
async def extract_for_cag_endpoint(file: UploadFile = File(...)):
    """Extract text from PDF for CAG approach - no chunking, just full text extraction"""
    try:
        print(f"📁 [CAG API] Received file: {file.filename}")
        print(f"📁 [CAG API] File size: {file.size} bytes")
        print(f"📁 [CAG API] Content type: {file.content_type}")
        
        # Validate file type
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
        # Read file content
        file_content = await file.read()
        
        # Step 1: Extract text only (no chunking for CAG)
        print("🔍 [CAG API] Step 1: Extracting text from PDF...")
        text_result = extract_text_from_pdf(file_content)
        extracted_text = text_result["extracted_text"]
        
        # For CAG approach, we create a single "chunk" with the full text
        # This maintains compatibility with existing API structure
        print("📄 [CAG API] Step 2: Creating single full-text chunk for CAG...")
        
        # Create a single chunk with the full text
        full_text_chunk = {
            "text": extracted_text,
            "metadata": {
                "filename": file.filename,
                "chunk_index": 0,
                "chunk_start": 0,
                "chunk_end": len(extracted_text),
                "chunk_size": len(extracted_text),
                "estimated_tokens": len(extracted_text.split()),
                "chunk_type": "full_text",
                "processing_method": "cag_extract_only",
                "pages_count": text_result["pages_count"],
                "text_length": text_result["text_length"]
            },
            "embedding": []  # No embedding for CAG approach
        }
        
        print(f"✅ [CAG API] Processing completed successfully")
        print(f"📊 [CAG API] Results: 1 full-text chunk, {len(extracted_text)} characters")
        
        return ChunkingResponse(
            success=True,
            message="Text extracted successfully for CAG approach - no chunking performed",
            chunks=[ChunkResponse(text=full_text_chunk["text"], metadata=full_text_chunk["metadata"], embedding=full_text_chunk["embedding"])],
            filename=file.filename,
            total_chunks=1,
            avg_chunk_size=len(extracted_text)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"💥 [CAG API] Unexpected error: {e}")
        logger.error(f"Unexpected error in chunk_text_endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# RESTORED ORIGINAL CHUNKING ENDPOINT (for backward compatibility)
@app.post("/chunk-text", response_model=ChunkingResponse)
async def chunk_text_endpoint(file: UploadFile = File(...)):
    """Extract text from PDF and create chunks using LlamaIndex"""
    try:
        print(f"📁 [CHUNK API] Received file: {file.filename}")
        print(f"📁 [CHUNK API] File size: {file.size} bytes")
        print(f"📁 [CHUNK API] Content type: {file.content_type}")
        
        # Validate file type
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
        # Read file content
        file_content = await file.read()
        
        # Step 1: Extract text
        print("🔍 [CHUNK API] Step 1: Extracting text from PDF...")
        text_result = extract_text_from_pdf(file_content)
        extracted_text = text_result["extracted_text"]
        
        # Step 2: Create chunks
        print("🔪 [CHUNK API] Step 2: Creating text chunks...", extracted_text[:100])
        chunks = create_text_chunks(extracted_text, file.filename)
        
        # Step 3: Generate embeddings
        print("🤖 [CHUNK API] Step 3: Generating embeddings...")
        chunks_with_embeddings = await generate_embeddings_for_chunks(chunks)
        
        # Calculate average chunk size
        avg_chunk_size = sum(len(chunk["text"]) for chunk in chunks_with_embeddings) / len(chunks_with_embeddings) if chunks_with_embeddings else 0
        
        print(f"✅ [CHUNK API] Processing completed successfully")
        print(f"📊 [CHUNK API] Results: {len(chunks_with_embeddings)} chunks with embeddings, avg size: {avg_chunk_size:.0f} chars")
        
        return ChunkingResponse(
            success=True,
            message="Text extracted, chunked, and embeddings generated successfully",
            chunks=[ChunkResponse(text=chunk["text"], metadata=chunk["metadata"], embedding=chunk["embedding"]) for chunk in chunks_with_embeddings],
            filename=file.filename,
            total_chunks=len(chunks_with_embeddings),
            avg_chunk_size=int(avg_chunk_size)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"💥 [CHUNK API] Unexpected error: {e}")
        logger.error(f"Unexpected error in chunk_text_endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
