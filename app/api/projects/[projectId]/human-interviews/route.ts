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

    // Get all human respondents for this project
    const { data: humanRespondents, error: respondentsError } = await supabase
      .from("human_respondents")
      .select(`
        *,
        project:projects (
          id,
          name
        )
      `)
      .eq("project_id", params.projectId)
      .order("created_at", { ascending: false })

    if (respondentsError) {
      console.error("Error fetching human respondents:", respondentsError)
      return NextResponse.json({ error: respondentsError.message }, { status: 500 })
    }

    // Get message counts for each respondent
    const respondentsWithCounts = await Promise.all(
      humanRespondents.map(async (respondent) => {
        const { count: messageCount, error: msgCountError } = await supabase
          .from("human_conversations")
          .select("*", { count: "exact", head: true })
          .eq("human_respondent_id", respondent.id)
          .eq("project_id", params.projectId)

        // Get last message timestamp
        const { data: lastMessage, error: lastMsgError } = await supabase
          .from("human_conversations")
          .select("created_at")
          .eq("human_respondent_id", respondent.id)
          .eq("project_id", params.projectId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single()

        return {
          ...respondent,
          message_count: messageCount || 0,
          last_message_at: lastMessage?.created_at || null
        }
      })
    )

    return NextResponse.json({ humanInterviews: respondentsWithCounts })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
