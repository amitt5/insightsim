import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"


// POST route to process a RAG document for a persona (extract text, create chunks, generate embeddings)
export async function POST(
  request: Request,
  { params }: { params: { personaId: string; documentId: string } }
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
      .eq("persona_id", params.personaId)
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
      console.log(`Downloading file: ${document.file_path}`)
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
      const response = await fetch(`${pythonServiceUrl}/extract-for-cag`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to extract text from PDF')
      }

      const chunkingResult = await response.json()
      console.log(`Text extraction successful for CAG approach: ${chunkingResult.total_chunks} full-text document created`)
      console.log(`Full text length: ${chunkingResult.avg_chunk_size} characters`)

      // Step 3: Store full text in database (CAG approach - no chunking)
      console.log("Storing full text in database for CAG approach...")
      
      // For CAG approach, we store the full text directly in the rag_documents table
      // instead of creating multiple chunks
      const { error: updateTextError } = await supabase
        .from("rag_documents")
        .update({ 
          full_text: chunkingResult.chunks[0].text, // Store full text from the single "chunk"
          text_length: chunkingResult.chunks[0].metadata.text_length,
          pages_count: chunkingResult.chunks[0].metadata.pages_count,
          processing_method: 'cag_extract_only',
          updated_at: new Date().toISOString()
        })
        .eq("id", params.documentId)

      if (updateTextError) {
        console.error("Error storing full text:", updateTextError)
        throw new Error("Failed to store document full text")
      }

      console.log(`Successfully stored full text (${chunkingResult.chunks[0].text.length} characters) for CAG approach`)

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

      console.log(`Successfully processed RAG document: ${document.original_filename}`)
      
      return NextResponse.json({
        success: true,
        message: "Document processed successfully for CAG approach - text extracted and stored as full text",
        totalChunks: chunkingResult.total_chunks, // Will be 1 for CAG approach
        avgChunkSize: chunkingResult.avg_chunk_size, // Will be full text length
        textLength: chunkingResult.chunks[0].text.length,
        pagesCount: chunkingResult.chunks[0].metadata.pages_count,
        processingMethod: 'cag_extract_only',
        document: {
          id: document.id,
          filename: document.original_filename,
          status: 'completed'
        }
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

