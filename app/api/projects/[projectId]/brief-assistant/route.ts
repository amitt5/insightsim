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

    // Get the active brief assistant conversation for this project
    const { data: conversation, error: conversationError } = await supabase
      .from('brief_assistant_conversations')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (conversationError && conversationError.code !== 'PGRST116') {
      console.error("Error fetching brief assistant conversation:", conversationError)
      return NextResponse.json({ error: conversationError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      conversation: conversation || null 
    })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

export async function POST(
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
    const body = await request.json()
    const { conversationHistory, isReadyToGenerate, briefGenerated, generatedBrief } = body
    // Deactivate any existing active conversations for this project
    await supabase
      .from('brief_assistant_conversations')
      .update({ is_active: false })
      .eq('project_id', projectId)
      .eq('is_active', true)
    // Create new conversation
    const { data: newConversation, error: createError } = await supabase
      .from('brief_assistant_conversations')
      .insert({
        project_id: projectId,
        conversation_history: conversationHistory,
        is_ready_to_generate: isReadyToGenerate,
        brief_generated: briefGenerated,
        generated_brief: generatedBrief,
        is_active: true
      })
      .select()
      .single()
    if (createError) {
      console.error("Error creating brief assistant conversation:", createError)
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }
    return NextResponse.json({ 
      conversation: newConversation 
    })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

export async function PATCH(
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
    const body = await request.json()
    const { conversationHistory, isReadyToGenerate, briefGenerated, generatedBrief } = body
    // Update the active conversation for this project
    const { data: updatedConversation, error: updateError } = await supabase
      .from('brief_assistant_conversations')
      .update({
        conversation_history: conversationHistory,
        is_ready_to_generate: isReadyToGenerate,
        brief_generated: briefGenerated,
        generated_brief: generatedBrief
      })
      .eq('project_id', projectId)
      .eq('is_active', true)
      .select()
      .single()
    if (updateError) {
      console.error("Error updating brief assistant conversation:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    } 
    return NextResponse.json({ 
      conversation: updatedConversation 
    })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
