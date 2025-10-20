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

    // First get the project to verify ownership
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("user_id")
      .eq("id", params.projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    if (project.user_id !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all personas for this project
    const { data: projectPersonas, error: personasError } = await supabase
      .from("project_personas")
      .select(`
        persona_id,
        personas (*)
      `)
      .eq("project_id", params.projectId)
      .eq("is_deleted", false)

    if (personasError) {
      console.error("Error fetching project personas:", personasError)
      return NextResponse.json({ error: personasError.message }, { status: 500 })
    }

    // Extract personas from the join
    const personas = projectPersonas.map(pp => pp.personas)

    return NextResponse.json({ personas })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

export async function POST(
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

    // First get the project to verify ownership
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("user_id")
      .eq("id", params.projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    if (project.user_id !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get personas data from request body
    const { personas } = await request.json()

    // Insert personas and get their IDs
    const { data: createdPersonas, error: personasError } = await supabase
      .from("personas")
      .insert(
        personas.map((p: any) => ({
          ...p,
          user_id: session.user.id
        }))
      )
      .select()

    if (personasError) {
      console.error("Error creating personas:", personasError)
      return NextResponse.json({ error: personasError.message }, { status: 500 })
    }

    // Link personas to project
    const { error: linkError } = await supabase
      .from("project_personas")
      .insert(
        createdPersonas.map((p: any) => ({
          project_id: params.projectId,
          persona_id: p.id
        }))
      )

    if (linkError) {
      console.error("Error linking personas to project:", linkError)
      return NextResponse.json({ error: linkError.message }, { status: 500 })
    }

    return NextResponse.json({ personas: createdPersonas })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
