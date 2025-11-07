import { NextResponse } from "next/server"
import { checkProjectAccess } from "@/utils/projectAccess"
import { getTranscriptionStatus, formatTranscriptWithSpeakers } from "@/lib/assemblyai"

// GET route to check transcription status from AssemblyAI and update database
export async function GET(
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

    // Get transcript ID from metadata
    const metadata = interview.metadata || {}
    const transcriptId = metadata.assemblyai_transcript_id

    if (!transcriptId) {
      return NextResponse.json({ 
        error: "No transcription ID found. Please start transcription first." 
      }, { status: 400 })
    }

    // Check status from AssemblyAI
    const status = await getTranscriptionStatus(transcriptId)

    console.log('=== Manual Status Check ===')
    console.log('Interview ID:', params.interviewId)
    console.log('Transcript ID:', transcriptId)
    console.log('Status:', status.status)

    // Update database based on status
    if (status.status === 'completed' && (status.text || status.utterances)) {
      // Prefer utterances with speaker labels if available
      let transcriptText: string;
      if (status.utterances && status.utterances.length > 0) {
        transcriptText = formatTranscriptWithSpeakers(status.utterances);
        console.log('=== Transcription Completed (Manual Check - with Speaker Labels) ===')
        console.log('Number of utterances:', status.utterances.length)
        console.log('Speakers detected:', [...new Set(status.utterances.map(u => u.speaker))])
      } else if (status.text) {
        transcriptText = status.text;
        console.log('=== Transcription Completed (Manual Check) ===')
        console.log('Transcript Length:', status.text.length, 'characters')
      } else {
        throw new Error('No transcript text or utterances received');
      }

      console.log('Transcript Preview (first 500 chars):', transcriptText.substring(0, 500))
      console.log('Full Transcript:', transcriptText)

      const { error: updateError } = await supabase
        .from("uploaded_interviews")
        .update({
          status: 'processed',
          transcript_text: transcriptText,
          error_message: null
        })
        .eq("id", params.interviewId)

      if (updateError) {
        console.error('Error updating interview:', updateError)
        return NextResponse.json({ 
          error: "Failed to update interview" 
        }, { status: 500 })
      }

      console.log(`✅ Transcription status updated for interview ${params.interviewId}`)

      return NextResponse.json({
        success: true,
        status: 'completed',
        message: "Transcription completed",
        transcriptText: transcriptText
      })
    } else if (status.status === 'error' || status.error) {
      const { error: updateError } = await supabase
        .from("uploaded_interviews")
        .update({
          status: 'error',
          error_message: status.error || 'Transcription failed'
        })
        .eq("id", params.interviewId)

      if (updateError) {
        console.error('Error updating interview status:', updateError)
        return NextResponse.json({ 
          error: "Failed to update interview" 
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        status: 'error',
        message: "Transcription failed",
        error: status.error
      })
    } else {
      // Still processing
      return NextResponse.json({
        success: true,
        status: status.status,
        message: `Transcription is ${status.status}`
      })
    }

  } catch (error: any) {
    console.error('Error checking transcription status:', error)
    return NextResponse.json({ 
      error: error.message || 'An unexpected error occurred' 
    }, { status: 500 })
  }
}

