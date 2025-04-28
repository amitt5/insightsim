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
        personas = personaData.map((persona: any) => ({
          ...persona,
          traits: processTraits(persona.traits)
        }));
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


const processTraits = (traits: string | string[]) => {
  let processedTraits: string[] = [];
  if (Array.isArray(traits)) {
    processedTraits = traits;
  } else if (typeof traits === 'string') {
    if (traits.trim().startsWith('[')) {
      try {
        processedTraits = JSON.parse(traits);
      } catch {
        processedTraits = traits.split(',').map((t: string) => t.trim());
      }
    } else {
      processedTraits = traits.split(',').map((t: string) => t.trim());
    }
  }
  return processedTraits;
};

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies })
  const { id } = params
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
  if (simulation.status === 'Completed') {
    return NextResponse.json({ error: "Simulation already completed" }, { status: 400 })
  }
  const { data: updatedSimulation, error: updateError } = await supabase
    .from("simulations")
    .update({ status: 'Completed' })
    .eq("id", id)
    .select()
    .single()
  if (updateError) {
    console.error("Error updating simulation:", updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }
  return NextResponse.json(updatedSimulation)
}
