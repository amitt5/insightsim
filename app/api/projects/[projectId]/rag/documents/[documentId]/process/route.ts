import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"


// POST route to process a RAG document (extract text, create chunks, generate embeddings)
export async function POST(
  request: Request,
  { params }: { params: { projectId: string; documentId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get session data to verify user is logged in
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // First, get the document to verify ownership
    const { data: document, error: fetchError } = await supabase
      .from("rag_documents")
      .select("*")
      .eq("id", params.documentId)
      .eq("project_id", params.projectId)
      .eq("user_id", session.user.id)
      .single()

    if (fetchError) {
      console.error("Error fetching document:", fetchError)
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Check if document is already processed
    if (document.status === 'completed') {
      return NextResponse.json({ 
        message: "Document is already processed",
        document 
      })
    }

    // Update document status to processing
    const { error: updateError } = await supabase
      .from("rag_documents")
      .update({ 
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq("id", params.documentId)

    if (updateError) {
      console.error("Error updating document status:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    try {
      // Step 1: Download file from Supabase storage
      console.log(`Downloading aaaamit file: ${document.file_path}`)
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('rag-documents')
        .download(document.file_path)

      if (downloadError) {
        console.error("Error downloading file:", downloadError)
        throw new Error("Failed to download document from storage")
      }

      // Step 2: Send file to Python service for text extraction
      console.log("Sending file to Python PDF service for text extraction...")
      const formData = new FormData()
      formData.append('file', fileData, document.original_filename)

      const pythonServiceUrl = process.env.PYTHON_PDF_SERVICE_URL || 'http://localhost:8000'
      const response = await fetch(`${pythonServiceUrl}/chunk-text`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to extract text from PDF')
      }

      const chunkingResult = await response.json()
      console.log(`Text extraction and chunking successful: ${chunkingResult.total_chunks} chunks created`)
      console.log(`Average chunk size: ${chunkingResult.avg_chunk_size} characters`)

      // Update document status to completed
      const { error: completeError } = await supabase
        .from("rag_documents")
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq("id", params.documentId)

      if (completeError) {
        console.error("Error completing document processing:", completeError)
        throw new Error("Failed to update document status")
      }

      console.log(`Successfully extracted text from RAG document: ${document.original_filename}`)
      
      return NextResponse.json({
        success: true,
        message: "Text extracted and chunked successfully",
        totalChunks: chunkingResult.total_chunks,
        avgChunkSize: chunkingResult.avg_chunk_size,
        chunks: chunkingResult.chunks
      })

    } catch (processingError: any) {
      console.error("Error processing document:", processingError)
      
      // Update document status to failed
      await supabase
        .from("rag_documents")
        .update({ 
          status: 'failed',
          processing_error: processingError.message,
          updated_at: new Date().toISOString()
        })
        .eq("id", params.documentId)

      return NextResponse.json({ 
        error: processingError.message || 'Document processing failed' 
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('Error in RAG document processing API:', error)
    return NextResponse.json({ 
      error: error.message || 'An unexpected error occurred' 
    }, { status: 500 })
  }
}
