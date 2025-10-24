import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { BatchSaveMessagesRequest, BatchSaveMessagesResponse } from '@/types/database';

export async function POST(request: Request) {
  try {
    const body: BatchSaveMessagesRequest = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Validate all messages have required fields
    for (const message of messages) {
      if (!message.project_id || !message.human_respondent_id || !message.message) {
        return NextResponse.json(
          { error: 'All messages must have project_id, human_respondent_id, and message' },
          { status: 400 }
        );
      }
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Get the current message count for ordering
    const { data: lastMessage, error: countError } = await supabase
      .from('human_conversations')
      .select('message_order')
      .eq('human_respondent_id', messages[0].human_respondent_id)
      .order('message_order', { ascending: false })
      .limit(1)
      .single();

    let nextOrder = lastMessage ? lastMessage.message_order + 1 : 1;

    // Prepare messages for batch insert
    const messagesToInsert = messages.map((message) => {
      const messageData: any = {
        project_id: message.project_id,
        human_respondent_id: message.human_respondent_id,
        message: message.message,
        sender_type: message.sender_type || 'respondent',
        message_order: nextOrder++,
        message_type: message.message_type || 'text',
        metadata: {
          timestamp: new Date().toISOString()
        }
      };

      // Add voice-specific fields if this is a voice message
      if (message.message_type === 'voice') {
        messageData.voice_session_id = message.voice_session_id;
        messageData.voice_metadata = message.voice_metadata || {};
      }

      return messageData;
    });

    // Insert all messages in a single transaction
    const { data: insertedMessages, error: insertError } = await supabase
      .from('human_conversations')
      .insert(messagesToInsert)
      .select();

    if (insertError) {
      throw insertError;
    }

    const response: BatchSaveMessagesResponse = {
      saved_count: insertedMessages?.length || 0,
      failed_count: 0,
      errors: []
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error saving batch messages:', error);
    return NextResponse.json(
      { error: 'Failed to save batch messages' },
      { status: 500 }
    );
  }
}
