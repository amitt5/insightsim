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
    const { data: calibrationSession, error: calibrationSessionError } = await supabase
      .from("calibration_sessions")
      .select("*")
      .eq("id", id)
      .single()
    
    if (calibrationSessionError) {
      console.error("Error fetching simulation:", calibrationSessionError)
      return NextResponse.json({ error: calibrationSessionError.message }, { status: 500 })
    }
    
    if (!calibrationSession) {
      return NextResponse.json({ error: "Simulation not found" }, { status: 404 })
    }
    
   
    // const personaIds = calibrationSession.selected_persona_ids
    console.log('personaIds111',calibrationSession,  calibrationSession.selected_persona_ids)
    // Step 3: If there are persona IDs, fetch the persona details
    let personas = []
    if (calibrationSession.selected_persona_ids.length > 0) {
      const { data: personaData, error: personaError } = await supabase
        .from("personas")
        .select("*")
        .in("id", calibrationSession.selected_persona_ids)
      
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
      calibrationSession,
      personas
    })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
} 

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { id } = params
    const body = await request.json();

    // Remove id from body if present to avoid updating the primary key
    if ('id' in body) delete body.id;

    const { data, error } = await supabase
      .from("calibration_sessions")
      .update(body)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating calibration session:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ calibrationSession: data })
  } catch (error) {
    console.error("Unexpected error in PATCH:", error)
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