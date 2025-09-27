import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Fetch messages
    const { data: messages, error: messagesError } = await supabase
      .from('simulation_messages')
      .select('*')
      .eq('simulation_id', params.id)
      .order('created_at', { ascending: true });

    if (messagesError) {
      throw messagesError;
    }

    // Fetch personas for this simulation
    const { data: personas, error: personasError } = await supabase
      .from('personas')
      .select('id, name')
      .eq('simulation_id', params.id);

    if (personasError) {
      throw personasError;
    }

    return NextResponse.json({
      messages: messages || [],
      personas: personas || []
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}
