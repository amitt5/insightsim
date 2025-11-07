import { NextResponse } from "next/server"
import { checkProjectAccess } from "@/utils/projectAccess"

// PATCH route to update speaker mappings for an uploaded interview
export async function PATCH(
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

    // Get speaker mappings from request body
    const body = await request.json()
    const { speaker_mappings } = body

    if (!speaker_mappings || typeof speaker_mappings !== 'object') {
      return NextResponse.json({ 
        error: "Invalid speaker_mappings format" 
      }, { status: 400 })
    }

    // Validate speaker mappings structure
    for (const [speaker, mapping] of Object.entries(speaker_mappings)) {
      if (!mapping || typeof mapping !== 'object') {
        return NextResponse.json({ 
          error: `Invalid mapping for speaker ${speaker}` 
        }, { status: 400 })
      }
      const { name, role } = mapping as any
      if (!name || typeof name !== 'string') {
        return NextResponse.json({ 
          error: `Name is required for speaker ${speaker}` 
        }, { status: 400 })
      }
      if (role && !['moderator', 'respondent'].includes(role)) {
        return NextResponse.json({ 
          error: `Invalid role for speaker ${speaker}. Must be 'moderator' or 'respondent'` 
        }, { status: 400 })
      }
    }

    // Update metadata with speaker mappings
    const currentMetadata = interview.metadata || {}
    const updatedMetadata = {
      ...currentMetadata,
      speaker_mappings: speaker_mappings
    }

    const { data: updatedInterview, error: updateError } = await supabase
      .from("uploaded_interviews")
      .update({ metadata: updatedMetadata })
      .eq("id", params.interviewId)
      .eq("project_id", params.projectId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating speaker mappings:', updateError)
      return NextResponse.json({ 
        error: "Failed to update speaker mappings" 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      interview: updatedInterview
    })

  } catch (error: any) {
    console.error('Error updating speaker mappings:', error)
    return NextResponse.json({ 
      error: error.message || 'An unexpected error occurred' 
    }, { status: 500 })
  }
}

