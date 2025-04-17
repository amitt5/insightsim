import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

// Define the structure of a message entry
interface MessageEntry {
  simulation_id: string;
  sender_type: 'moderator' | 'participant';
  sender_id: string | null;
  message: string;
  turn_number: number;
}

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the request body
    const { messages } = await request.json() as { messages: MessageEntry[] }
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "No messages provided" }, { status: 400 })
    }
    
    console.log(`Saving ${messages.length} messages to the database`)
    
    // Insert all messages into the simulation_messages table
    const { data, error } = await supabase
      .from('simulation_messages')
      .insert(messages)
      .select()
    
    if (error) {
      console.error("Error saving messages to database:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully saved ${messages.length} messages`,
      data 
    })
  } catch (error: any) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
} 