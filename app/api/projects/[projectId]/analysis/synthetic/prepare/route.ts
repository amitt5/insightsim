import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { checkProjectAccess } from "@/utils/projectAccess"

// POST /api/projects/[projectId]/analysis/synthetic/prepare
// Returns normalized simulations + messages for synthetic analysis (no LLM call yet)
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

    // Fetch simulations for this project
    const { data: simulations, error: simsError } = await supabase
      .from("simulations")
      .select("id")
      .eq("project_id", projectId)

    if (simsError) {
      return NextResponse.json({ error: simsError.message }, { status: 500 })
    }

    const simulationIds = (simulations || []).map((s: any) => s.id)

    let messagesBySimulation: Record<string, any[]> = {}
    if (simulationIds.length > 0) {
      const { data: messages, error: msgError } = await supabase
        .from("simulation_messages")
        .select("id, simulation_id, sender_type, message, turn_number, created_at")
        .in("simulation_id", simulationIds)
        .order("simulation_id", { ascending: true })
        .order("turn_number", { ascending: true })

      if (msgError) {
        return NextResponse.json({ error: msgError.message }, { status: 500 })
      }

      for (const msg of messages || []) {
        const bucket = (messagesBySimulation[msg.simulation_id] ||= [])
        bucket.push({
          role: msg.sender_type === "Moderator" ? "moderator" : "participant",
          text: msg.message,
          turn: msg.turn_number,
          createdAt: msg.created_at,
        })
      }
    }

    // Build normalized payload
    const payload = {
      projectId,
      source: "synthetic",
      simulations: (simulations || []).map((s: any) => ({
        simulationId: s.id,
        // name: s.name,
        messages: (messagesBySimulation[s.id] || []),
      })),
      gatheredAt: new Date().toISOString(),
    }

    return NextResponse.json({ success: true, data: payload })
  } catch (error: any) {
    console.error("Error preparing synthetic analysis:", error)
    return NextResponse.json({ error: error.message || "Unexpected error" }, { status: 500 })
  }
}


