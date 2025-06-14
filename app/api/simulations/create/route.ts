import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { logError } from "@/utils/errorLogger"

export async function POST(request: Request) {
  let userId: string | undefined;
  
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get session data to verify user is logged in
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    userId = session.user.id;
    
    // Parse request body
    const requestData = await request.json()
    
    // Handle media URLs - use the stimulus_media_url array directly as JSONB
    const mediaUrls = requestData.stimulus_media_url || [];
    
    // Log the incoming data for debugging
    console.log("Creating simulation with media:", {
      mediaUrls: mediaUrls,
      count: mediaUrls.length
    });
      
    // Create simulation record
    const { data: simulation, error } = await supabase.from("simulations").insert([
      {
        user_id: session.user.id,
        study_title: requestData.study_title,
        study_type: requestData.study_type,
        mode: requestData.mode,
        topic: requestData.topic,
        stimulus_media_url: mediaUrls, // This is now a JSONB array, no need for string conversion
        discussion_questions: requestData.discussion_questions,
        turn_based: requestData.turn_based,
        num_turns: requestData.num_turns,
        status: "Draft",
      },
    ]).select()

    if (error) {
      console.error("Error creating simulation:", error)
      
      // Log simulation creation error
      await logError(
        'simulation_creation',
        error,
        JSON.stringify(requestData),
        {
          user_id: session.user.id,
          study_title: requestData.study_title,
          study_type: requestData.study_type,
          mode: requestData.mode,
          error_code: error.code,
          error_details: error.details
        },
        userId
      );
      
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If personas were provided and simulation was created successfully
    if (simulation && simulation.length > 0 && requestData.personas && requestData.personas.length > 0) {
      const simulationId = simulation[0].id
      
      // Create entries in simulation_personas table
      const personaEntries = requestData.personas.map((personaId: string) => ({
        simulation_id: simulationId,
        persona_id: personaId
      }))
      
      const { error: personaError } = await supabase
        .from("simulation_personas")
        .insert(personaEntries)
        
      if (personaError) {
        console.error("Error adding personas to simulation:", personaError)
        
        // Log persona assignment error
        await logError(
          'simulation_persona_assignment',
          personaError,
          JSON.stringify(personaEntries),
          {
            simulation_id: simulationId,
            persona_count: requestData.personas.length,
            error_code: personaError.code,
            error_details: personaError.details
          },
          userId
        );
        
        return NextResponse.json({ 
          simulation: simulation[0],
          error: "Simulation created, but failed to add personas" 
        })
      }
    }
    
    return NextResponse.json({ simulation: simulation ? simulation[0] : null })
  } catch (error) {
    console.error("Unexpected error:", error)
    
    // Log unexpected error
    await logError(
      'simulation_creation_unexpected',
      error instanceof Error ? error : String(error),
      undefined,
      {
        user_id: userId,
        error_type: 'unexpected_error'
      },
      userId
    );
    
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
} 