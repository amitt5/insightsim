import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current session
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

    // Build the query
    let query = supabase
      .from("simulations")
      .select("*")
      .order("created_at", { ascending: false })

    // Only filter by user_id if the user is not an admin
    if (userData?.role !== 'admin') {
      query = query.eq("user_id", session.user.id)
    }

    // Execute the query
    const { data: simulations, error: simulationsError } = await query
    
    if (simulationsError) {
      console.error("Error fetching simulations:", simulationsError)
      return NextResponse.json({ error: simulationsError.message }, { status: 500 })
    }

    // Early return if no simulations found
    if (!simulations || simulations.length === 0) {
      return NextResponse.json({ simulations: [], participantCounts: {} })
    }
    
    // Get all simulation IDs
    const simulationIds = simulations.map(sim => sim.id)
    
    // Fetch participant counts for these simulations
    const { data: participantData, error: participantError } = await supabase
      .from("simulation_personas")
      .select("simulation_id")
      .in("simulation_id", simulationIds)
    
    if (participantError) {
      console.error("Error fetching participant counts:", participantError)
      // Still return simulations even if participant count fails
      return NextResponse.json({ 
        simulations, 
        participantCounts: {},
        error: "Failed to fetch participant counts"
      })
    }
    
    // Count participants per simulation
    const participantCounts: Record<string, number> = {}
    
    if (participantData) {
      participantData.forEach((item: { simulation_id: string }) => {
        const simId = item.simulation_id
        participantCounts[simId] = (participantCounts[simId] || 0) + 1
      })
    }
    
    // Return both datasets
    return NextResponse.json({ 
      simulations,
      participantCounts
    })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
