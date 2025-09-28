import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current session
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has access to this project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, user_id')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Check user permissions
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('user_id', session.user.id)
      .single()

    if (userError) {
      return NextResponse.json({ error: "Failed to fetch user role" }, { status: 500 })
    }

    // Only allow access if user owns the project or is admin
    if (userData?.role !== 'admin' && project.user_id !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get all brief assistant conversations for this project (including inactive ones)
    const { data: conversations, error: conversationsError } = await supabase
      .from('brief_assistant_conversations')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (conversationsError) {
      console.error("Error fetching brief assistant conversations:", conversationsError)
      return NextResponse.json({ error: conversationsError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      conversations: conversations || [] 
    })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
