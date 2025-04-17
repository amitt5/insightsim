import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: { simulation_id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { simulation_id } = params
    
    // Fetch messages for this simulation
    const { data: messages, error } = await supabase
      .from("simulation_messages")
      .select(`
        id,
        simulation_id,
        sender_type,
        sender_id,
        message,
        turn_number,
        created_at
      `)
      .eq("simulation_id", simulation_id)
      .order("turn_number", { ascending: true })
    
    if (error) {
      console.error("Error fetching simulation messages:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Fetch personas related to this simulation
    const { data: personas, error: personasError } = await supabase
      .from("personas")
      .select("id, name")
      .in(
        "id", 
        messages
          .filter(msg => msg.sender_id !== null)
          .map(msg => msg.sender_id)
      )
    
    if (personasError) {
      console.error("Error fetching personas:", personasError)
      return NextResponse.json({ 
        messages,
        error: "Failed to fetch persona details" 
      })
    }
    
    // Return both messages and personas
    return NextResponse.json({ 
      messages,
      personas: personas || [] 
    })
  } catch (error: any) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
} 