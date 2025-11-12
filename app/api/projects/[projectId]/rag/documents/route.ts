import {GoogleGenAI} from '@google/genai';
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { v4 as uuidv4 } from 'uuid'
import {
  getOrCreateFileSearchStore,
  uploadFileToFileSearchStore,
} from "@/lib/googleFileSearch"

// GET route to fetch all RAG documents for a project
export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const resolvedParams = await params;
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get session data to verify user is logged in
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch RAG documents for the project
    const { data: documents, error } = await supabase
      .from("rag_documents")
      .select("*")
      .eq("project_id", resolvedParams.projectId)
      .eq("user_id", session.user.id)
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

// POST route to upload a new RAG document directly to Google File Search Store
export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const resolvedParams = await params;
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get session data to verify user is logged in
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user has access to this project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, google_file_search_store_id")
      .eq("id", resolvedParams.projectId)
      .eq("user_id", session.user.id)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});


    // const response = await ai.models.generateContent({
    //   model: 'gemini-2.5-flash',
    //   contents: 'Why is the sky blue?',
    // });
    // console.log('amit211', response.text);

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ 
        error: 'Invalid file type. Only PDF files are supported.' 
      }, { status: 400 })
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File size too large. Maximum size is 50MB.' 
      }, { status: 400 })
    }

    // Generate unique file name for Google File Search
    const fileExtension = file.name.split('.').pop()
    const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "")
    const sanitizedFileName = fileNameWithoutExt
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
    
    const uniqueId = uuidv4()
    const googleFileName = `${sanitizedFileName}-${uniqueId}.${fileExtension}`

    console.log(`Uploading RAG document to Google File Search Store: ${file.name}`)

    // Step 1: Get or create File Search Store for the project
    let storeName: string;
    try {
      storeName = await getOrCreateFileSearchStore(
        resolvedParams.projectId,
        project.google_file_search_store_id
      )
    } catch (error: any) {
      // Check if it's a missing API key error
      if (error.message?.includes('GEMINI_API_KEY')) {
        return NextResponse.json({ 
          error: 'Google Gemini API key is not configured. Please set GEMINI_API_KEY environment variable.',
          details: error.message
        }, { status: 500 })
      }
      // Re-throw other errors
      throw error;
    }

    // Update project with store ID if it's new
    if (!project.google_file_search_store_id) {
      const { error: updateProjectError } = await supabase
        .from("projects")
        .update({ google_file_search_store_id: storeName })
        .eq("id", resolvedParams.projectId)

      if (updateProjectError) {
        console.error("Error updating project with store ID:", updateProjectError)
        // Continue anyway, we can update it later
      }
    }

    // Step 2: Upload file directly to Google File Search Store using Python SDK
    // The Python script handles the upload and waits for operation completion
    let googleFileNameResult: string = googleFileName;

    try {
      const uploadResult = await uploadFileToFileSearchStore(
        storeName,
        file,
        googleFileName
      )
      // Python script already waits for operation to complete
      // So we get the final result directly
      googleFileNameResult = uploadResult.fileName;
      console.log(`File upload and import completed successfully, file: ${googleFileNameResult}`)
    } catch (uploadError: any) {
      console.error("Error uploading file to Google File Search Store:", uploadError)
      
      // Check if it's a missing API key error
      if (uploadError.message?.includes('GEMINI_API_KEY')) {
        return NextResponse.json({ 
          error: 'Google Gemini API key is not configured. Please set GEMINI_API_KEY environment variable.',
          details: uploadError.message
        }, { status: 500 })
      }
      
      // Create document record with failed status
      const documentData = {
        id: uuidv4(),
        project_id: resolvedParams.projectId,
        user_id: session.user.id,
        filename: googleFileName,
        original_filename: file.name,
        file_path: null, // No Supabase storage path
        file_size: file.size,
        mime_type: file.type,
        status: 'failed',
        processing_method: 'google_file_search',
        processing_error: uploadError.message || 'Failed to upload to Google File Search Store',
        google_file_name: null
      }

      const { data: document, error: dbError } = await supabase
        .from("rag_documents")
        .insert(documentData)
        .select()
        .single()

      if (dbError) {
        console.error('Database error:', dbError)
        return NextResponse.json({ 
          error: dbError.message || 'Failed to save document record' 
        }, { status: 500 })
      }

      return NextResponse.json({ 
        error: uploadError.message || 'Failed to upload to Google File Search Store',
        document
      }, { status: 500 })
    }

    // Step 4: Create document record in database with completed status
    const documentData = {
      id: uuidv4(),
      project_id: resolvedParams.projectId,
      user_id: session.user.id,
      filename: googleFileName,
      original_filename: file.name,
      file_path: null, // No Supabase storage path
      file_size: file.size,
      mime_type: file.type,
      status: 'completed',
      processing_method: 'google_file_search',
      google_file_name: googleFileNameResult
    }

    const { data: document, error: dbError } = await supabase
      .from("rag_documents")
      .insert(documentData)
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json({ 
        error: dbError.message || 'Failed to save document record' 
      }, { status: 500 })
    }

    console.log(`Successfully uploaded and processed RAG document: ${file.name}`)
    
    return NextResponse.json({
      success: true,
      document,
      processingMethod: 'google_file_search'
    })

  } catch (error: any) {
    console.error('Error in RAG document upload API:', error)
    
    // Check if it's a missing API key error
    if (error.message?.includes('GEMINI_API_KEY')) {
      return NextResponse.json({ 
        error: 'Google Gemini API key is not configured. Please set GEMINI_API_KEY environment variable.',
        details: error.message
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      error: error.message || 'An unexpected error occurred' 
    }, { status: 500 })
  }
}
