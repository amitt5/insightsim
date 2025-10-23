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

    // Fetch user's role from the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('user_id', session.user.id)
      .single()

    if (userError) {
      console.error("Error fetching user role:", userError)
      return NextResponse.json({ error: "Failed to fetch user role" }, { status: 500 })
    }

    // Build query conditionally
    let query = supabase
      .from("projects")
      .select("*")
      .eq("id", params.projectId)
      .eq("is_deleted", false)

    // Only filter by user_id if the user is not an admin
    if (userData?.role !== 'admin') {
      query = query.eq("user_id", session.user.id)
    }

    const { data: project, error } = await query.single()
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

    // Fetch user's role from the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('user_id', session.user.id)
      .single()

    if (userError) {
      console.error("Error fetching user role:", userError)
      return NextResponse.json({ error: "Failed to fetch user role" }, { status: 500 })
    }

    // Get update data from request body
    const updates = await request.json()

    // Remove any fields that shouldn't be updated directly
    delete updates.id
    delete updates.user_id
    delete updates.created_at
    delete updates.is_deleted
    delete updates.deleted_at

    // Validate media_urls if provided
    if (updates.media_urls && !Array.isArray(updates.media_urls)) {
      return NextResponse.json({ error: "media_urls must be an array" }, { status: 400 })
    }

    // Add updated_at timestamp
    updates.updated_at = new Date().toISOString()

    // Build update query conditionally
    let updateQuery = supabase
      .from("projects")
      .update(updates)
      .eq("id", projectId)
      .eq("is_deleted", false)

    // Only filter by user_id if the user is not an admin
    if (userData?.role !== 'admin') {
      updateQuery = updateQuery.eq("user_id", session.user.id)
    }

    const { data: project, error } = await updateQuery
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

    // Fetch user's role from the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('user_id', session.user.id)
      .single()

    if (userError) {
      console.error("Error fetching user role:", userError)
      return NextResponse.json({ error: "Failed to fetch user role" }, { status: 500 })
    }

    // Build delete query conditionally
    let deleteQuery = supabase
      .from("projects")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", params.projectId)

    // Only filter by user_id if the user is not an admin
    if (userData?.role !== 'admin') {
      deleteQuery = deleteQuery.eq("user_id", session.user.id)
    }

    const { data: project, error } = await deleteQuery
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