import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { project_id, human_respondent_id, is_first_message = false } = body;

    if (!project_id || !human_respondent_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Fetch project data
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', project_id)
      .single();

    if (projectError || !project) {
      throw new Error('Failed to fetch project data');
    }

    // Fetch human respondent data
    const { data: respondent, error: respondentError } = await supabase
      .from('human_respondents')
      .select('*')
      .eq('id', human_respondent_id)
      .single();

    if (respondentError || !respondent) {
      throw new Error('Failed to fetch respondent data');
    }

    // Fetch conversation history
    const { data: messages, error: messagesError } = await supabase
      .from('human_conversations')
      .select('*')
      .eq('human_respondent_id', human_respondent_id)
      .order('message_order', { ascending: true });

    if (messagesError) {
      throw messagesError;
    }

    // Prepare conversation history for OpenAI
    const conversationHistory = messages?.map(msg => ({
      role: msg.sender_type === 'moderator' ? 'assistant' : 'user' as 'assistant' | 'user',
      content: msg.message
    })) || [];

    // Prepare system message
    let systemMessage = `You are an expert interviewer conducting a one-on-one interview about "${project.name}". 
Your goal is to gather detailed insights following this discussion guide: ${JSON.stringify(project.discussion_questions)}.
The respondent's name is ${respondent.name}. They are ${respondent.age} years old and identify as ${respondent.gender}.

Guidelines:
1. Ask one question at a time
2. Follow up on interesting points before moving to the next topic
3. Keep responses concise and focused
4. Be professional but conversational
5. Don't share the full discussion guide with the respondent
6. Don't mention that you're an AI

${is_first_message ? "Start by introducing yourself and asking the first question." : "Continue the interview naturally."}`;

    // Get AI response
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemMessage },
        ...conversationHistory
      ],
      temperature: 0.7,
    });

    const moderatorMessage = completion.choices[0].message.content;

    if (!moderatorMessage) {
      throw new Error('Failed to generate moderator response');
    }

    // Get the next message order number
    const nextOrder = messages?.length ? Math.max(...messages.map(m => m.message_order)) + 1 : 1;

    // Save the moderator's message
    const { data: savedMessage, error: saveError } = await supabase
      .from('human_conversations')
      .insert([
        {
          project_id,
          human_respondent_id,
          message: moderatorMessage,
          sender_type: 'moderator',
          message_order: nextOrder,
          message_type: 'text', // AI moderator messages are always text
          metadata: {
            timestamp: new Date().toISOString(),
            is_first_message
          }
        }
      ])
      .select()
      .single();

    if (saveError) {
      throw saveError;
    }

    return NextResponse.json(savedMessage);
  } catch (error) {
    console.error('Error in AI moderator:', error);
    return NextResponse.json(
      { error: 'Failed to generate moderator response' },
      { status: 500 }
    );
  }
}
