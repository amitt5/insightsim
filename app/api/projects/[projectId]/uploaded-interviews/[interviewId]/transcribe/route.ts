import { NextResponse } from "next/server"
import { checkProjectAccess } from "@/utils/projectAccess"
import { submitTranscription, pollTranscription } from "@/lib/assemblyai"

// POST route to transcribe an uploaded audio interview
export async function POST(
  request: Request,
  { params }: { params: { projectId: string; interviewId: string } }
) {
  try {
    const accessResult = await checkProjectAccess(params.projectId)
    
    if (!accessResult.success) {
      return accessResult.response!
    }

    const { supabase } = accessResult

    // Get the interview record
    const { data: interview, error: fetchError } = await supabase
      .from("uploaded_interviews")
      .select("*")
      .eq("id", params.interviewId)
      .eq("project_id", params.projectId)
      .single()

    if (fetchError || !interview) {
      return NextResponse.json({ 
        error: "Interview not found" 
      }, { status: 404 })
    }

    // Check if it's an audio file
    if (interview.file_type !== 'audio') {
      return NextResponse.json({ 
        error: "Only audio files can be transcribed" 
      }, { status: 400 })
    }

    // Check if already processed
    if (interview.status === 'processed' && interview.transcript_text) {
      return NextResponse.json({ 
        message: "Interview already transcribed",
        interview
      })
    }

    // Update status to processing
    await supabase
      .from("uploaded_interviews")
      .update({ status: 'processing' })
      .eq("id", params.interviewId)

    // Get public URL for the audio file
    const bucket = 'uploaded-interviews'
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(interview.file_path)

    if (!urlData?.publicUrl) {
      await supabase
        .from("uploaded_interviews")
        .update({ 
          status: 'error',
          error_message: 'Failed to generate public URL for audio file'
        })
        .eq("id", params.interviewId)
      
      return NextResponse.json({ 
        error: "Failed to generate public URL for audio file" 
      }, { status: 500 })
    }

    try {
      // Get webhook URL for this project
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
        'http://localhost:3000'
      const webhookUrl = `${baseUrl}/api/projects/${params.projectId}/uploaded-interviews/${params.interviewId}/transcribe/webhook`

      // Submit transcription to AssemblyAI
      const transcriptId = await submitTranscription(urlData.publicUrl, webhookUrl)

      // Store transcript ID in metadata
      await supabase
        .from("uploaded_interviews")
        .update({ 
          metadata: { 
            ...(interview.metadata || {}),
            assemblyai_transcript_id: transcriptId
          }
        })
        .eq("id", params.interviewId)

      // For immediate response, we'll poll once to check status
      // The webhook will handle the final update
      try {
        const transcriptText = await pollTranscription(transcriptId, 1, 1000)
        
        console.log('=== Transcription Received via Polling ===')
        console.log('Interview ID:', params.interviewId)
        console.log('Transcript ID:', transcriptId)
        console.log('Transcript Length:', transcriptText.length, 'characters')
        console.log('Transcript Preview (first 500 chars):', transcriptText.substring(0, 500))
        console.log('Full Transcript:', transcriptText)
        
        // If transcription completed immediately, update the database
        await supabase
          .from("uploaded_interviews")
          .update({ 
            status: 'processed',
            transcript_text: transcriptText,
            error_message: null
          })
          .eq("id", params.interviewId)

        console.log(`✅ Transcription completed and saved for interview ${params.interviewId}`)

        return NextResponse.json({
          success: true,
          message: "Transcription completed",
          interview: {
            ...interview,
            status: 'processed',
            transcript_text: transcriptText
          }
        })
      } catch (pollError: any) {
        // If polling didn't complete immediately, that's fine - webhook will handle it
        console.log('Transcription in progress, webhook will handle completion')
        
        return NextResponse.json({
          success: true,
          message: "Transcription started",
          transcriptId
        })
      }

    } catch (error: any) {
      console.error('Transcription error:', error)
      
      // Update status to error
      await supabase
        .from("uploaded_interviews")
        .update({ 
          status: 'error',
          error_message: error.message || 'Transcription failed'
        })
        .eq("id", params.interviewId)

      return NextResponse.json({ 
        error: error.message || 'Transcription failed' 
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('Error in transcription API:', error)
    return NextResponse.json({ 
      error: error.message || 'An unexpected error occurred' 
    }, { status: 500 })
  }
}


