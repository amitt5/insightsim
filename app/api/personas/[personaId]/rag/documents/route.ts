import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { v4 as uuidv4 } from 'uuid'

// GET route to fetch all RAG documents for a persona
export async function GET(
  request: Request,
  { params }: { params: { personaId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get session data to verify user is logged in
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch RAG documents for the persona
    const { data: documents, error } = await supabase
      .from("rag_documents")
      .select("*")
      .eq("persona_id", params.personaId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching RAG documents:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      documents: documents || [],
      total: documents?.length || 0
    })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

// POST route to upload a new RAG document for a persona
export async function POST(
  request: Request,
  { params }: { params: { personaId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get session data to verify user is logged in
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const bucket = formData.get('bucket') as string || 'rag-documents'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ 
        error: 'Invalid file type. Only PDF files are supported.' 
      }, { status: 400 })
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File size too large. Maximum size is 10MB.' 
      }, { status: 400 })
    }

    // Generate unique file path for persona
    const fileExtension = file.name.split('.').pop()
    const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "")
    const sanitizedFileName = fileNameWithoutExt
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
    
    const uniqueId = uuidv4()
    const filePath = `personas/${params.personaId}/${sanitizedFileName}-${uniqueId}.${fileExtension}`

    console.log(`Uploading RAG document to bucket: ${bucket}, path: ${filePath}`)

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ 
        error: uploadError.message || 'Upload failed' 
      }, { status: 500 })
    }

    // Create document record in database
    const documentData = {
      id: uuidv4(),
      persona_id: params.personaId,
      user_id: session.user.id,
      filename: `${sanitizedFileName}-${uniqueId}.${fileExtension}`,
      original_filename: file.name,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type,
      status: 'uploaded'
    }

    const { data: document, error: dbError } = await supabase
      .from("rag_documents")
      .insert(documentData)
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      // Clean up uploaded file if database insert fails
      await supabase.storage.from(bucket).remove([filePath])
      return NextResponse.json({ 
        error: dbError.message || 'Failed to save document record' 
      }, { status: 500 })
    }

    console.log(`Successfully uploaded RAG document: ${filePath}`)
    
    return NextResponse.json({
      success: true,
      document
    })

  } catch (error: any) {
    console.error('Error in RAG document upload API:', error)
    return NextResponse.json({ 
      error: error.message || 'An unexpected error occurred' 
    }, { status: 500 })
  }
}

