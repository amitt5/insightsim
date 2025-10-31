import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

// DELETE route to delete a RAG document for a persona
export async function DELETE(
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

    // First, get the document to verify ownership and get file path
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

    // Delete the file from storage
    const bucket = 'rag-documents' // Default bucket
    const { error: storageError } = await supabase.storage
      .from(bucket)
      .remove([document.file_path])

    if (storageError) {
      console.error('Storage deletion error:', storageError)
      // Continue with database deletion even if storage deletion fails
    }

    // Delete the document record from database (this will cascade delete chunks)
    const { error: deleteError } = await supabase
      .from("rag_documents")
      .delete()
      .eq("id", params.documentId)
      .eq("persona_id", params.personaId)

    if (deleteError) {
      console.error("Error deleting document:", deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    console.log(`Successfully deleted RAG document: ${document.original_filename}`)
    
    return NextResponse.json({
      success: true,
      message: "Document deleted successfully"
    })

  } catch (error: any) {
    console.error('Error in RAG document deletion API:', error)
    return NextResponse.json({ 
      error: error.message || 'An unexpected error occurred' 
    }, { status: 500 })
  }
}

// GET route to fetch a specific RAG document for a persona
export async function GET(
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

    // Fetch the specific document
    const { data: document, error } = await supabase
      .from("rag_documents")
      .select("*")
      .eq("id", params.documentId)
      .eq("persona_id", params.personaId)
      .single()

    if (error) {
      console.error("Error fetching document:", error)
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    return NextResponse.json({ document })

  } catch (error: any) {
    console.error('Error in RAG document fetch API:', error)
    return NextResponse.json({ 
      error: error.message || 'An unexpected error occurred' 
    }, { status: 500 })
  }
}

