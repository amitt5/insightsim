import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

const PYTHON_RAG_SERVICE_URL = process.env.PYTHON_RAG_SERVICE_URL || 'http://localhost:8000'

export async function GET(
  request: Request,
  { params }: { params: { documentId: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  
    // Get the current session
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { documentId } = params

    // Get document details and verify access
    const { data: document, error: docError } = await supabase
      .from('rag_documents')
      .select(`
        *,
        simulations!inner (
          id
        )
      `)
      .eq('id', documentId)
      .single()

    if (docError || !document) {
      return NextResponse.json(
        { error: "Document not found or access denied" }, 
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      document
    })

  } catch (error) {
    console.error('RAG document status error:', error)
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { documentId: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get the current session
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { documentId } = params

    // Get document details and verify access
    const { data: document, error: docError } = await supabase
      .from('rag_documents')
      .select(`
        *,
        simulations!inner (
          id
        )
      `)
      .eq('id', documentId)
      .single()

    if (docError || !document) {
      return NextResponse.json(
        { error: "Document not found or access denied" }, 
        { status: 404 }
      )
    }

    // Call Python service to clean up processing data (optional - don't fail if it's down)
    try {
      await fetch(`${PYTHON_RAG_SERVICE_URL}/api/document/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      })
    } catch (error) {
      console.warn('Python service unavailable for cleanup:', error)
    }

    // Delete from storage
    if (document.storage_path) {
      const { error: storageError } = await supabase.storage
        .from('rag-documents')
        .remove([document.storage_path])
      
      if (storageError) {
        console.error('Error deleting from storage:', storageError)
        // Continue with database deletion even if storage fails
      }
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('rag_documents')
      .delete()
      .eq('id', documentId)

    if (deleteError) {
      console.error('Error deleting document record:', deleteError)
      return NextResponse.json(
        { error: "Failed to delete document" }, 
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully"
    })

  } catch (error) {
    console.error('RAG document delete error:', error)
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    )
  }
} 