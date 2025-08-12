import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { logError } from "@/utils/errorLogger"

// Define the structure of a message entry
interface MessageEntry {
  simulation_id: string;
  sender_type: 'moderator' | 'participant';
  sender_id: string | null;
  message: string;
  turn_number: number;
}

export async function POST(request: Request) {
  let userId: string | undefined;
  
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get user ID for error logging
    const { data: { session } } = await supabase.auth.getSession();
    userId = session?.user?.id;
    
    // Get the request body
    const { messages } = await request.json() as { messages: MessageEntry[] }
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      // Log validation error
      await logError(
        'simulation_messages_validation',
        'No messages provided or invalid format',
        JSON.stringify({ messages }),
        {
          has_messages: !!messages,
          is_array: Array.isArray(messages),
          length: messages?.length || 0
        },
        userId
      );
      
      return NextResponse.json({ error: "No messages provided" }, { status: 400 })
    }
    
    // replaceme: console.log(`Saving ${messages.length} messages to the database`)
    
    // Insert all messages into the simulation_messages table
    const { data, error } = await supabase
      .from('simulation_messages')
      .insert(messages)
      .select()
    
    if (error) {
      console.error("Error saving messages to database:", error)
      
      // Log database error
      await logError(
        'simulation_messages_database_error',
        error,
        JSON.stringify(messages),
        {
          message_count: messages.length,
          error_code: error.code,
          error_details: error.details
        },
        userId
      );
      
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully saved ${messages.length} messages`,
      data 
    })
  } catch (error: any) {
    console.error("Unexpected error:", error)
    
    // Log unexpected error
    await logError(
      'simulation_messages_unexpected',
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