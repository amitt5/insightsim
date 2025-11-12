import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { checkProjectAccess } from "@/utils/projectAccess"

// DELETE route to delete an uploaded interview
export async function DELETE(
  request: Request,
  { params }: { params: { projectId: string; interviewId: string } }
) {
  try {
    const accessResult = await checkProjectAccess(params.projectId)
    
    if (!accessResult.success) {
      return accessResult.response!
    }

    const { supabase } = accessResult

    // First, get the interview to find the file path
    const { data: interview, error: fetchError } = await supabase
      .from("uploaded_interviews")
      .select("file_path")
      .eq("id", params.interviewId)
      .eq("project_id", params.projectId)
      .single()

    if (fetchError || !interview) {
      return NextResponse.json({ 
        error: "Interview not found" 
      }, { status: 404 })
    }

    // Delete from storage
    const bucket = 'uploaded-interviews'
    const { error: storageError } = await supabase.storage
      .from(bucket)
      .remove([interview.file_path])

    if (storageError) {
      console.error('Storage deletion error:', storageError)
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from("uploaded_interviews")
      .delete()
      .eq("id", params.interviewId)
      .eq("project_id", params.projectId)

    if (dbError) {
      console.error('Database deletion error:', dbError)
      return NextResponse.json({ 
        error: dbError.message || 'Failed to delete interview' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: "Interview deleted successfully"
    })

  } catch (error: any) {
    console.error('Error deleting uploaded interview:', error)
    return NextResponse.json({ 
      error: error.message || 'An unexpected error occurred' 
    }, { status: 500 })
  }
}

