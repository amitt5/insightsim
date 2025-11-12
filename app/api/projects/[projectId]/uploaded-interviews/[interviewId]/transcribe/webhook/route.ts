import { NextResponse } from "next/server"
import { checkProjectAccess } from "@/utils/projectAccess"
import { formatTranscriptWithSpeakers, Utterance } from "@/lib/assemblyai"

/**
 * Webhook endpoint for AssemblyAI transcription completion
 * AssemblyAI will POST to this endpoint when transcription is complete
 */
export async function POST(
  request: Request,
  { params }: { params: { projectId: string; interviewId: string } }
) {
  try {
    // Verify the request is from AssemblyAI (optional but recommended)
    // You can add signature verification here if needed
    
    const body = await request.json()
    
    console.log('=== AssemblyAI Webhook Received ===')
    console.log('Project ID:', params.projectId)
    console.log('Interview ID:', params.interviewId)
    console.log('Webhook Payload:', JSON.stringify(body, null, 2))
    
    // AssemblyAI webhook payload structure:
    // {
    //   "transcript_id": "...",
    //   "status": "completed" | "error",
    //   "text": "...", // if completed (without speaker labels)
    //   "utterances": [...], // if completed with speaker_labels: true
    //   "error": "..." // if error
    // }
    
    const { transcript_id, status, text, utterances, error } = body

    if (!transcript_id) {
      return NextResponse.json({ error: "Missing transcript_id" }, { status: 400 })
    }

    // Get access to Supabase (we need to verify the interview belongs to this project)
    const accessResult = await checkProjectAccess(params.projectId)
    
    if (!accessResult.success) {
      // For webhooks, we might want to be more lenient, but let's verify project access
      console.error('Webhook: Project access denied', params.projectId)
      return accessResult.response!
    }

    const { supabase } = accessResult

    // Verify the interview exists and matches the transcript_id in metadata
    const { data: interview, error: fetchError } = await supabase
      .from("uploaded_interviews")
      .select("*")
      .eq("id", params.interviewId)
      .eq("project_id", params.projectId)
      .single()

    if (fetchError || !interview) {
      console.error('Webhook: Interview not found', params.interviewId)
      return NextResponse.json({ error: "Interview not found" }, { status: 404 })
    }

    // Verify transcript_id matches (stored in metadata)
    const metadata = interview.metadata || {}
    if (metadata.assemblyai_transcript_id !== transcript_id) {
      console.error('Webhook: Transcript ID mismatch', {
        stored: metadata.assemblyai_transcript_id,
        received: transcript_id
      })
      return NextResponse.json({ error: "Transcript ID mismatch" }, { status: 400 })
    }

    // Update the interview based on transcription status
    if (status === 'completed' && (text || utterances)) {
      // Prefer utterances with speaker labels if available
      let transcriptText: string;
      if (utterances && utterances.length > 0) {
        transcriptText = formatTranscriptWithSpeakers(utterances as Utterance[]);
        console.log('=== Transcription Completed (with Speaker Labels) ===')
        console.log('Transcript ID:', transcript_id)
        console.log('Number of utterances:', utterances.length)
        console.log('Speakers detected:', [...new Set(utterances.map((u: Utterance) => u.speaker))])
      } else if (text) {
        transcriptText = text;
        console.log('=== Transcription Completed ===')
        console.log('Transcript ID:', transcript_id)
        console.log('Transcript Length:', text.length, 'characters')
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
        console.error('Webhook: Error updating interview', updateError)
        return NextResponse.json({ error: "Failed to update interview" }, { status: 500 })
      }

      console.log(`✅ Webhook: Transcription completed and saved for interview ${params.interviewId}`)
      return NextResponse.json({ success: true, message: "Transcription completed" })
    } else if (status === 'error' || error) {
      const { error: updateError } = await supabase
        .from("uploaded_interviews")
        .update({
          status: 'error',
          error_message: error || 'Transcription failed'
        })
        .eq("id", params.interviewId)

      if (updateError) {
        console.error('Webhook: Error updating interview status', updateError)
        return NextResponse.json({ error: "Failed to update interview" }, { status: 500 })
      }

      console.error(`Webhook: Transcription failed for interview ${params.interviewId}:`, error)
      return NextResponse.json({ success: true, message: "Error status updated" })
    } else {
      // Status is still processing or queued
      console.log(`Webhook: Transcription still in progress for interview ${params.interviewId}`)
      return NextResponse.json({ success: true, message: "Status received" })
    }

  } catch (error: any) {
    console.error('Error in transcription webhook:', error)
    // Return 200 to prevent AssemblyAI from retrying on our errors
    // But log the error for debugging
    return NextResponse.json({ 
      error: error.message || 'An unexpected error occurred' 
    }, { status: 200 })
  }
}

