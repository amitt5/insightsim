import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { v4 as uuidv4 } from 'uuid'
import { checkProjectAccess } from "@/utils/projectAccess"

// GET route to fetch all uploaded interviews for a project
export async function GET(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const accessResult = await checkProjectAccess(params.projectId)
    
    if (!accessResult.success) {
      return accessResult.response!
    }

    const { supabase } = accessResult

    // Fetch uploaded interviews for the project
    const { data: interviews, error } = await supabase
      .from("uploaded_interviews")
      .select("*")
      .eq("project_id", params.projectId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching uploaded interviews:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      interviews: interviews || [],
      total: interviews?.length || 0
    })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

// POST route to upload a new interview file (transcript or audio)
export async function POST(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const accessResult = await checkProjectAccess(params.projectId)
    
    if (!accessResult.success) {
      return accessResult.response!
    }

    const { supabase, session } = accessResult

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Determine file type based on MIME type
    let fileType: 'transcript' | 'audio' = 'transcript'
    const mimeType = file.type.toLowerCase()
    
    if (mimeType.startsWith('audio/') || 
        mimeType.includes('audio') ||
        ['.mp3', '.wav', '.m4a', '.ogg', '.flac', '.aac'].some(ext => 
          file.name.toLowerCase().endsWith(ext)
        )) {
      fileType = 'audio'
    } else if (mimeType.includes('text') || 
               mimeType.includes('document') ||
               ['.txt', '.doc', '.docx', '.rtf'].some(ext => 
                 file.name.toLowerCase().endsWith(ext)
               )) {
      fileType = 'transcript'
    } else {
      return NextResponse.json({ 
        error: 'Invalid file type. Please upload transcript files (.txt, .doc, .docx) or audio files (.mp3, .wav, .m4a)' 
      }, { status: 400 })
    }

    // Validate file size (50MB limit for audio, 10MB for transcripts)
    const maxSize = fileType === 'audio' ? 50 * 1024 * 1024 : 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: `File size too large. Maximum size is ${fileType === 'audio' ? '50MB' : '10MB'}.` 
      }, { status: 400 })
    }

    // Generate unique file path
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || ''
    const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "")
    const sanitizedFileName = fileNameWithoutExt
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
    
    const uniqueId = uuidv4()
    const bucket = 'uploaded-interviews'
    const filePath = `${params.projectId}/${sanitizedFileName}-${uniqueId}.${fileExtension}`

    console.log(`Uploading interview file to bucket: ${bucket}, path: ${filePath}, type: ${fileType}`)

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

    // For transcript files, read the content immediately
    let transcriptText: string | null = null
    if (fileType === 'transcript') {
      try {
        const text = await file.text()
        transcriptText = text.trim()
      } catch (error) {
        console.error('Error reading transcript file:', error)
        // Continue without transcript text - it can be processed later
      }
    }

    // Create interview record in database
    const interviewData = {
      id: uuidv4(),
      project_id: params.projectId,
      user_id: session.user.id,
      filename: `${sanitizedFileName}-${uniqueId}.${fileExtension}`,
      original_filename: file.name,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type,
      file_type: fileType,
      status: fileType === 'transcript' && transcriptText ? 'processed' : 'uploaded',
      transcript_text: transcriptText
    }

    const { data: interview, error: dbError } = await supabase
      .from("uploaded_interviews")
      .insert(interviewData)
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      // Clean up uploaded file if database insert fails
      await supabase.storage.from(bucket).remove([filePath])
      return NextResponse.json({ 
        error: dbError.message || 'Failed to save interview record' 
      }, { status: 500 })
    }

    console.log(`Successfully uploaded interview file: ${filePath}`)
    
    // If it's an audio file, we'll need to process it (transcribe) asynchronously
    // For now, we'll return success and handle transcription in a separate endpoint
    
    return NextResponse.json({
      success: true,
      interview
    })

  } catch (error: any) {
    console.error('Error in uploaded interview API:', error)
    return NextResponse.json({ 
      error: error.message || 'An unexpected error occurred' 
    }, { status: 500 })
  }
}

