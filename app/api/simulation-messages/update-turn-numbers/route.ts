import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { logError } from "@/utils/errorLogger"

export async function PATCH(request: Request) {
  let userId: string | undefined;
  
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get user ID for error logging
    const { data: { session } } = await supabase.auth.getSession();
    userId = session?.user?.id;
    
    // Get the request body
    const { simulation_id, message_ids, offset } = await request.json() as { 
      simulation_id: string;
      message_ids: string[];
      offset: number;
    }
    
    if (!simulation_id || !message_ids || !Array.isArray(message_ids) || message_ids.length === 0 || !offset) {
      return NextResponse.json({ 
        error: "simulation_id, message_ids array, and offset are required" 
      }, { status: 400 })
    }
    
    console.log(`Updating turn_numbers for ${message_ids.length} messages with offset ${offset}`)
    
    // Update turn_numbers for all specified messages
    // We'll do this in a loop to update each message individually
    const updates = [];
    for (const messageId of message_ids) {
      // First, get the current turn_number
      const { data: currentMessage, error: fetchError } = await supabase
        .from('simulation_messages')
        .select('turn_number')
        .eq('id', messageId)
        .eq('simulation_id', simulation_id)
        .single();
      
      if (fetchError || !currentMessage) {
        console.error(`Error fetching message ${messageId}:`, fetchError);
        continue; // Skip this message
      }
      
      // Update with new turn_number
      const { error: updateError } = await supabase
        .from('simulation_messages')
        .update({ turn_number: currentMessage.turn_number + offset })
        .eq('id', messageId)
        .eq('simulation_id', simulation_id);
      
      if (updateError) {
        console.error(`Error updating message ${messageId}:`, updateError);
        updates.push({ messageId, success: false, error: updateError.message });
      } else {
        updates.push({ messageId, success: true });
      }
    }
    
    const successCount = updates.filter(u => u.success).length;
    const failCount = updates.filter(u => !u.success).length;
    
    if (failCount > 0) {
      console.warn(`${failCount} messages failed to update`);
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Updated ${successCount} messages (${failCount} failed)`,
      updates
    })
  } catch (error: any) {
    console.error("Unexpected error:", error)
    
    // Log unexpected error
    await logError(
      'simulation_messages_update_turn_numbers',
      error instanceof Error ? error : String(error),
      undefined,
      {
        user_id: userId,
        error_type: 'unexpected_error'
      },
      userId
    )
    
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

