import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: { projectId: string; documentId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch the document from database
    const { data: document, error: docError } = await supabase
      .from("rag_documents")
      .select("*")
      .eq("id", params.documentId)
      .eq("project_id", params.projectId)
      .eq("user_id", user.id)
      .single()

    if (docError || !document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Check if document is processed
    if (document.status !== 'completed') {
      return NextResponse.json({ 
        error: "Document not processed yet", 
        status: document.status 
      }, { status: 400 })
    }

    // CAG APPROACH: Use stored full_text if available (preferred method)
    if (document.full_text && document.processing_method === 'cag_extract_only') {
      console.log(`Using stored full_text for CAG document: ${document.original_filename}`)
      console.log(`Stored text length: ${document.full_text.length} characters`)
      
      return NextResponse.json({
        success: true,
        document: {
          id: document.id,
          filename: document.original_filename,
          status: document.status,
          processing_method: document.processing_method
        },
        extracted_text: document.full_text,
        text_length: document.text_length || document.full_text.length,
        pages_count: document.pages_count,
        source: 'stored_full_text'
      })
    }

    // FALLBACK: For documents processed with old chunking method, extract text from PDF
    console.log(`Document ${document.original_filename} doesn't have stored full_text, extracting from PDF...`)
    
    // Download file from Supabase storage
    console.log(`Downloading file for full text extraction: ${document.file_path}`)
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('rag-documents')
      .download(document.file_path)

    if (downloadError) {
      console.error('Error downloading file:', downloadError)
      return NextResponse.json({ 
        error: "Failed to download document" 
      }, { status: 500 })
    }

    // Send file to Python PDF service for text extraction only
    console.log("Sending file to Python PDF service for text extraction...")
    const formData = new FormData()
    formData.append('file', fileData, document.original_filename)

    const pythonServiceUrl = process.env.PYTHON_PDF_SERVICE_URL || 'http://localhost:8000'
    const response = await fetch(`${pythonServiceUrl}/extract-text`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Python service error:', errorData)
      return NextResponse.json({ 
        error: errorData.detail || 'Failed to extract text from PDF' 
      }, { status: 500 })
    }

    const extractionResult = await response.json()
    console.log(`Text extraction successful: ${extractionResult.text_length} characters extracted`)

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        filename: document.original_filename,
        status: document.status,
        processing_method: document.processing_method || 'chunked'
      },
      extracted_text: extractionResult.extracted_text,
      text_length: extractionResult.text_length,
      pages_count: extractionResult.pages_count,
      source: 'pdf_extraction'
    })

  } catch (error: any) {
    console.error('Error in full-text extraction:', error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error.message 
    }, { status: 500 })
  }
}
