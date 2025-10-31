import { NextResponse } from "next/server"
import { checkProjectAccess } from "@/utils/projectAccess"

export async function GET(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    // Use centralized project access control
    const accessResult = await checkProjectAccess(params.projectId)
    
    if (!accessResult.success) {
      return accessResult.response!
    }

    const { supabase } = accessResult

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
    const personas = projectPersonas.map((pp: any) => pp.personas)

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
    // Use centralized project access control
    const accessResult = await checkProjectAccess(params.projectId)
    
    if (!accessResult.success) {
      return accessResult.response!
    }

    const { supabase, session } = accessResult

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
