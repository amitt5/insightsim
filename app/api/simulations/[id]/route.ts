import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { id } = params
    
    // Step 1: Fetch the simulation by ID
    const { data: simulation, error: simulationError } = await supabase
      .from("simulations")
      .select("*")
      .eq("id", id)
      .single()
    
    if (simulationError) {
      console.error("Error fetching simulation:", simulationError)
      return NextResponse.json({ error: simulationError.message }, { status: 500 })
    }
    
    if (!simulation) {
      return NextResponse.json({ error: "Simulation not found" }, { status: 404 })
    }
    
    // Step 2: Fetch associated persona IDs from simulation_personas table
    const { data: simulationPersonas, error: personasError } = await supabase
      .from("simulation_personas")
      .select("persona_id")
      .eq("simulation_id", id)
    
    if (personasError) {
      console.error("Error fetching simulation_personas:", personasError)
      return NextResponse.json({ 
        simulation,
        personas: [],
        error: "Failed to fetch associated personas" 
      })
    }
    
    const personaIds = simulationPersonas.map(sp => sp.persona_id)
    
    // Step 3: If there are persona IDs, fetch the persona details
    let personas = []
    if (personaIds.length > 0) {
      const { data: personaData, error: personaError } = await supabase
        .from("personas")
        .select("*")
        .in("id", personaIds)
      
      if (personaError) {
        console.error("Error fetching personas:", personaError)
      } else {
        personas = personaData
      }
    }
    
    // Return all the data
    return NextResponse.json({
      simulation,
      personas
    })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
} 