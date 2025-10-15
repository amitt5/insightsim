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
        status: document.status
      },
      extracted_text: extractionResult.extracted_text,
      text_length: extractionResult.text_length,
      pages_count: extractionResult.pages_count
    })

  } catch (error: any) {
    console.error('Error in full-text extraction:', error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error.message 
    }, { status: 500 })
  }
}
