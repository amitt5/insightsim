import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SaveMessageRequest, SaveMessageResponse, BatchSaveMessagesRequest, BatchSaveMessagesResponse } from '@/types/database';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const human_respondent_id = searchParams.get('human_respondent_id');
    const project_id = searchParams.get('project_id');
    const message_type = searchParams.get('message_type'); // Optional filter for voice/text
    const voice_session_id = searchParams.get('voice_session_id'); // Optional filter for specific voice session

    if (!human_respondent_id || !project_id) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Build query with optional filters
    let query = supabase
      .from('human_conversations')
      .select('*')
      .eq('human_respondent_id', human_respondent_id)
      .eq('project_id', project_id);

    // Apply optional filters
    if (message_type) {
      query = query.eq('message_type', message_type);
    }
    if (voice_session_id) {
      query = query.eq('voice_session_id', voice_session_id);
    }

    // Order by created_at for proper chronological ordering (includes voice messages)
    const { data: messages, error: messagesError } = await query
      .order('created_at', { ascending: true });

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
    const body: SaveMessageRequest = await request.json();
    const { 
      project_id, 
      human_respondent_id, 
      message, 
      sender_type = 'respondent',
      message_type = 'text',
      voice_session_id,
      voice_metadata = {}
    } = body;

    if (!project_id || !human_respondent_id || !message) {
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

    // Prepare message data with voice support
    const messageData: any = {
      project_id,
      human_respondent_id,
      message,
      sender_type,
      message_order: nextOrder,
      message_type,
      metadata: {
        timestamp: new Date().toISOString()
      }
    };

    // Add voice-specific fields if this is a voice message
    if (message_type === 'voice') {
      messageData.voice_session_id = voice_session_id;
      messageData.voice_metadata = voice_metadata;
    }

    // Insert the new message
    const { data: newMessage, error: insertError } = await supabase
      .from('human_conversations')
      .insert([messageData])
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    const response: SaveMessageResponse = {
      id: newMessage.id,
      message_order: newMessage.message_order,
      created_at: newMessage.created_at
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error saving message:', error);
    return NextResponse.json(
      { error: 'Failed to save message' },
      { status: 500 }
    );
  }
}
