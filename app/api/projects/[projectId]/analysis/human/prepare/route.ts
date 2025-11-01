import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { checkProjectAccess } from "@/utils/projectAccess"

// Helper function to merge consecutive messages from the same sender
function mergeConsecutiveMessages(conversations: any[]): any[] {
  if (!conversations || conversations.length === 0) return []

  const merged: any[] = []
  let currentSender: string | null = null
  let currentMessages: string[] = []
  let lastCreatedAt: string | null = null
  let turnNumber = 1

  for (const conv of conversations) {
    const sender = conv.sender_type?.toLowerCase() || null
    const message = conv.message?.trim() || ""

    // Skip empty messages
    if (!message) continue

    if (sender === currentSender) {
      // Same sender - accumulate message
      currentMessages.push(message)
      lastCreatedAt = conv.created_at || lastCreatedAt
    } else {
      // Sender changed - save previous accumulated messages
      if (currentSender && currentMessages.length > 0) {
        merged.push({
          role: currentSender === "moderator" ? "moderator" : "respondent",
          text: currentMessages.join(" "),
          turn: turnNumber++,
          createdAt: lastCreatedAt,
        })
      }
      // Start new group
      currentSender = sender
      currentMessages = [message]
      lastCreatedAt = conv.created_at || null
    }
  }

  // Don't forget the last group
  if (currentSender && currentMessages.length > 0) {
    merged.push({
      role: currentSender === "moderator" ? "moderator" : "respondent",
      text: currentMessages.join(" "),
      turn: turnNumber,
      createdAt: lastCreatedAt,
    })
  }

  return merged
}

// POST /api/projects/[projectId]/analysis/human/prepare
// Returns normalized human interviews + merged messages for analysis (no LLM call yet)
export async function POST(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  const projectId = params.projectId
  try {
    // Auth required, but no ownership requirement (per user instruction: everyone)
    const access = await checkProjectAccess(projectId, false)
    if (!access.success || !access.supabase || !access.session) {
      return access.response || NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const supabase = access.supabase

    // Fetch human respondents for this project
    const { data: respondents, error: respondentsError } = await supabase
      .from("human_respondents")
      .select("id, name, email, age, gender")
      .eq("project_id", projectId)

    if (respondentsError) {
      return NextResponse.json({ error: respondentsError.message }, { status: 500 })
    }

    const respondentIds = (respondents || []).map((r: any) => r.id)
    let messagesByRespondent: Record<string, any[]> = {}

    if (respondentIds.length > 0) {
      // Fetch all conversations for these respondents
      const { data: conversations, error: convError } = await supabase
        .from("human_conversations")
        .select("id, human_respondent_id, sender_type, message, message_order, created_at")
        .in("human_respondent_id", respondentIds)
        .order("human_respondent_id", { ascending: true })
        .order("message_order", { ascending: true })

      if (convError) {
        return NextResponse.json({ error: convError.message }, { status: 500 })
      }

      // Group conversations by respondent
      const conversationsByRespondent: Record<string, any[]> = {}
      for (const conv of conversations || []) {
        const bucket = (conversationsByRespondent[conv.human_respondent_id] ||= [])
        bucket.push(conv)
      }

      // Merge consecutive messages for each respondent
      for (const respondentId of respondentIds) {
        const respondentConversations = conversationsByRespondent[respondentId] || []
        const mergedMessages = mergeConsecutiveMessages(respondentConversations)
        messagesByRespondent[respondentId] = mergedMessages
      }
    }

    // Build normalized payload - filter out interviews with 0 messages
    const interviews = (respondents || [])
      .map((r: any) => ({
        respondentId: r.id,
        name: r.name,
        email: r.email,
        age: r.age,
        gender: r.gender,
        messages: messagesByRespondent[r.id] || [],
      }))
      .filter((interview: any) => interview.messages.length > 0) // Filter out empty conversations

    const payload = {
      projectId,
      source: "human",
      interviews,
      gatheredAt: new Date().toISOString(),
    }

    // Console log for testing
    console.log("=== Human Interviews Prepare - Merged Messages ===")
    console.log(`Total respondents: ${(respondents || []).length}`)
    console.log(`Interviews with messages (after filtering): ${interviews.length}`)
    console.log("Payload structure:", JSON.stringify(payload, null, 2))
    console.log("Sample merged messages (first respondent):", 
      payload.interviews[0]?.messages?.slice(0, 3) || "No messages")

    return NextResponse.json({ success: true, data: payload })
  } catch (error: any) {
    console.error("Error preparing human analysis:", error)
    return NextResponse.json({ error: error.message || "Unexpected error" }, { status: 500 })
  }
}

