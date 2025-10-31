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
      humanRespondents.map(async (respondent: any) => {
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
