import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get session data to verify user is logged in
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch project data
    const { data: project, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", params.projectId)
      .eq("user_id", session.user.id)
      .eq("is_deleted", false)
      .single()
    console.log('amit-project', project)

    if (error) {
      console.error("Error fetching project:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    return NextResponse.json({ project })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    // Await params to get the projectId
    const { projectId } = await params
    
    // Create supabase client
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get session data to verify user is logged in
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get update data from request body
    const updates = await request.json()

    // Remove any fields that shouldn't be updated directly
    delete updates.id
    delete updates.user_id
    delete updates.created_at
    delete updates.is_deleted
    delete updates.deleted_at

    // Add updated_at timestamp
    updates.updated_at = new Date().toISOString()

    // Update project using the awaited projectId
    const { data: project, error } = await supabase
      .from("projects")
      .update(updates)
      .eq("id", projectId)
      .eq("user_id", session.user.id)
      .eq("is_deleted", false)
      .select()
      .single()

    if (error) {
      console.error("Error updating project:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    return NextResponse.json({ project })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get session data to verify user is logged in
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Soft delete the project
    const { data: project, error } = await supabase
      .from("projects")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", params.projectId)
      .eq("user_id", session.user.id)
      .select()
      .single()

    if (error) {
      console.error("Error deleting project:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    return NextResponse.json({ project })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}