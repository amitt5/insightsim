import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const human_respondent_id = searchParams.get('human_respondent_id');
    const simulation_id = searchParams.get('simulation_id');

    if (!human_respondent_id || !simulation_id) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Fetch all messages for this conversation
    const { data: messages, error: messagesError } = await supabase
      .from('human_conversations')
      .select('*')
      .eq('human_respondent_id', human_respondent_id)
      .eq('simulation_id', simulation_id)
      .order('message_order', { ascending: true });

    if (messagesError) {
      throw messagesError;
    }

    return NextResponse.json({ messages: messages || [] });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { simulation_id, human_respondent_id, message } = body;

    if (!simulation_id || !human_respondent_id || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Get the current message count for ordering
    const { data: lastMessage, error: countError } = await supabase
      .from('human_conversations')
      .select('message_order')
      .eq('human_respondent_id', human_respondent_id)
      .order('message_order', { ascending: false })
      .limit(1)
      .single();

    const nextOrder = lastMessage ? lastMessage.message_order + 1 : 1;

    // Insert the new message
    const { data: newMessage, error: insertError } = await supabase
      .from('human_conversations')
      .insert([
        {
          simulation_id,
          human_respondent_id,
          message,
          sender_type: 'respondent',
          message_order: nextOrder,
          metadata: {
            timestamp: new Date().toISOString()
          }
        }
      ])
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json(newMessage);
  } catch (error) {
    console.error('Error saving message:', error);
    return NextResponse.json(
      { error: 'Failed to save message' },
      { status: 500 }
    );
  }
}
