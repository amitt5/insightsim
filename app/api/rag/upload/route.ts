import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

const PYTHON_RAG_SERVICE_URL = process.env.PYTHON_RAG_SERVICE_URL || 'http://localhost:8000'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current session
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const simulationId = formData.get('simulationId') as string

    if (!file || !simulationId) {
      return NextResponse.json(
        { error: "File and simulationId are required" }, 
        { status: 400 }
      )
    }

    // Validate file type (text files only for Phase 1)
    const allowedTypes = ['text/plain', 'text/csv', 'application/json']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Only text files are supported in Phase 1" }, 
        { status: 400 }
      )
    }

    // Generate unique document ID and storage path
    const documentId = crypto.randomUUID()
    const fileExtension = file.name.split('.').pop() || 'txt'
    const storagePath = `${simulationId}/${documentId}.${fileExtension}`

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('rag-documents')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json(
        { error: "Failed to upload file to storage" }, 
        { status: 500 }
      )
    }

    // Create document record in database
    const { error: dbError } = await supabase
      .from('rag_documents')
      .insert({
        id: documentId,
        simulation_id: simulationId,
        document_name: file.name,
        storage_path: storagePath,
        file_type: file.type,
        file_size: file.size,
        processing_status: 'pending'
      })

    if (dbError) {
      console.error('Database insert error:', dbError)
      // Clean up uploaded file if database insert fails
      await supabase.storage.from('rag-documents').remove([storagePath])
      return NextResponse.json(
        { error: "Failed to create document record" }, 
        { status: 500 }
      )
    }

    // Call Python service to start processing
    try {
      const response = await fetch(`${PYTHON_RAG_SERVICE_URL}/api/process-document`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          simulation_id: simulationId,
          document_id: documentId,
          document_name: file.name,
          storage_path: storagePath
        })
      })

      if (!response.ok) {
        console.error('Python service error:', await response.text())
        // Don't fail the entire request - the file is uploaded and recorded
        // The processing can be retried later
      }
    } catch (error) {
      console.error('Error calling Python service:', error)
      // Same as above - don't fail the request
    }

    return NextResponse.json({
      success: true,
      documentId,
      fileName: file.name,
      storagePath,
      message: "Document uploaded and processing started"
    })

  } catch (error) {
    console.error('RAG upload error:', error)
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    )
  }
} 