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
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { id } = params
    
    // Fetch the simulation to verify it exists
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
    
    // Parse the request body for fields to update
    const body = await request.json();
    
    // Handle soft delete case
    if (body.is_deleted === true) {
      const { data: updatedSimulation, error: updateError } = await supabase
        .from("simulations")
        .update({ 
          is_deleted: true,
          deleted_at: new Date().toISOString()
        })
        .eq("id", id)
        .select()
        .single()
        
      if (updateError) {
        console.error("Error soft deleting simulation:", updateError)
        return NextResponse.json({ error: "Failed to delete simulation" }, { status: 500 })
      }
      
      return NextResponse.json({ 
        message: "Simulation deleted successfully",
        simulation: updatedSimulation 
      })
    }
    
    // Handle regular updates
    const { data: updatedSimulation, error: updateError } = await supabase
      .from("simulations")
      .update(body)
      .eq("id", id)
      .select()
      .single()
      
    if (updateError) {
      console.error("Error updating simulation:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }
    
    return NextResponse.json(updatedSimulation)
  } catch (error) {
    console.error("Unexpected error in PATCH:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { id } = params
    
    // Get session data to verify user is logged in
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Parse request body
    const requestData = await request.json()
    
    // Verify the simulation exists and belongs to the user
    const { data: existingSimulation, error: fetchError } = await supabase
      .from("simulations")
      .select("user_id")
      .eq("id", id)
      .single()
    
    if (fetchError) {
      console.error("Error fetching simulation:", fetchError)
      return NextResponse.json({ error: "Simulation not found" }, { status: 404 })
    }
    
    if (existingSimulation.user_id !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    
    // Handle media URLs
    const mediaUrls = requestData.stimulus_media_url || [];
    
    // Update simulation record
    const { data: simulation, error } = await supabase.from("simulations").update({
      study_title: requestData.study_title,
      study_type: requestData.study_type,
      mode: requestData.mode,
      topic: requestData.topic,
      stimulus_media_url: mediaUrls,
      discussion_questions: requestData.discussion_questions,
      turn_based: requestData.turn_based,
      num_turns: requestData.num_turns,
      status: requestData.status,
      active_step: requestData.active_step,
      brief_text: requestData.brief_text,
      brief_source: requestData.brief_source,
      updated_at: new Date().toISOString(),
    }).eq("id", id).select()

    if (error) {
      console.error("Error updating simulation:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If personas were provided, update the simulation_personas table
    if (requestData.personas !== undefined) {
      // First, delete existing persona associations
      await supabase
        .from("simulation_personas")
        .delete()
        .eq("simulation_id", id)
      
      // Then, add new associations if any personas provided
      if (requestData.personas.length > 0) {
        const personaEntries = requestData.personas.map((personaId: string) => ({
          simulation_id: id,
          persona_id: personaId
        }))
        
        const { error: personaError } = await supabase
          .from("simulation_personas")
          .insert(personaEntries)
          
        if (personaError) {
          console.error("Error updating personas for simulation:", personaError)
          return NextResponse.json({ 
            simulation: simulation ? simulation[0] : null,
            error: "Simulation updated, but failed to update personas" 
          })
        }
      }
    }
    
    return NextResponse.json({ simulation: simulation ? simulation[0] : null })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
