import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get session data to verify user is logged in
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Parse request body (optional - can be empty)
    const requestData = await request.json().catch(() => ({}))
    
    // Create minimal project record with defaults
    const { data: project, error } = await supabase.from("projects").insert([
      {
        user_id: session.user.id,
        name: requestData.name || "New Project",
        objective: null,
        target_group: null,
        product: null,
        brief_text: null,
        discussion_questions: null,
      },
    ]).select()

    if (error) {
      console.error("Error creating draft project:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ project: project ? project[0] : null })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
