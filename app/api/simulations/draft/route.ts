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
    
    // Create minimal simulation record with defaults
    const { data: simulation, error } = await supabase.from("simulations").insert([
      {
        user_id: session.user.id,
        study_title: requestData.study_title || "",
        study_type: requestData.study_type || "focus-group",
        mode: requestData.mode || "human-mod",
        topic: requestData.topic || "",
        stimulus_media_url: [],
        discussion_questions: [],
        turn_based: false,
        num_turns: 10,
        status: "Draft",
      },
    ]).select()

    if (error) {
      console.error("Error creating draft simulation:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ simulation: simulation ? simulation[0] : null })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
} 