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

CRITICAL FORMATTING REQUIREMENT:
You MUST start EVERY response with a status marker on the first line. Analyze the conversation and discussion guide topics to determine the current status.

Format your response as follows:
Line 1: [INTERVIEW_COMPLETE] or [INTERVIEW_INCOMPLETE]
Line 2: (blank line)
Line 3+: Your message to the respondent

Status Marker Rules:
- [INTERVIEW_COMPLETE] - Use ONLY when ALL discussion guide topics have been fully addressed and the interview should conclude
- [INTERVIEW_INCOMPLETE] - Use when there are still topics to cover, follow-up questions needed, or the conversation should continue

Example format:
[INTERVIEW_INCOMPLETE]

That's interesting, Amit. Can you elaborate on your experience with...

When all topics are covered, use:
[INTERVIEW_COMPLETE]

Thank you for your time and insights today, Amit. This has been very helpful.

${is_first_message ? "Start by introducing yourself and asking the first question. Use [INTERVIEW_INCOMPLETE] since this is the beginning." : "Continue the interview naturally."}`;

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
    console.log('moderatorMessage111', moderatorMessage);

    if (!moderatorMessage) {
      throw new Error('Failed to generate moderator response');
    }

    // Enhanced marker detection: check first line, then whole message, then default
    const lines = moderatorMessage.split('\n');
    const firstLine = lines[0].trim();
    let isComplete = false;
    let cleanMessage = moderatorMessage;
    let markerFound = false;

    // Step 1: Check first line for marker
    if (firstLine === '[INTERVIEW_COMPLETE]') {
      isComplete = true;
      markerFound = true;
      // Remove the first line (marker) and any blank lines that follow
      cleanMessage = lines.slice(1).join('\n').replace(/^\s*\n/, '').trim();
    } else if (firstLine === '[INTERVIEW_INCOMPLETE]') {
      isComplete = false;
      markerFound = true;
      // Remove the first line (marker) and any blank lines that follow
      cleanMessage = lines.slice(1).join('\n').replace(/^\s*\n/, '').trim();
    }

    // Step 2: If not found in first line, search entire message
    if (!markerFound) {
      const hasCompleteMarker = moderatorMessage.includes('[INTERVIEW_COMPLETE]');
      const hasIncompleteMarker = moderatorMessage.includes('[INTERVIEW_INCOMPLETE]');
      
      if (hasCompleteMarker) {
        isComplete = true;
        markerFound = true;
        // Remove marker from anywhere in the message
        cleanMessage = moderatorMessage.replace(/\[INTERVIEW_COMPLETE\]/g, '').trim();
      } else if (hasIncompleteMarker) {
        isComplete = false;
        markerFound = true;
        // Remove marker from anywhere in the message
        cleanMessage = moderatorMessage.replace(/\[INTERVIEW_INCOMPLETE\]/g, '').trim();
      }
    }

    // Step 3: If still not found, default to incomplete and log warning
    if (!markerFound) {
      console.warn('Status marker not found in expected format. First line:', firstLine);
      console.warn('Searched entire message. Defaulting to INCOMPLETE. Full message:', moderatorMessage);
      isComplete = false;
      cleanMessage = moderatorMessage;
    }

    // Clean up any extra whitespace
    cleanMessage = cleanMessage.replace(/\n\s*\n\s*\n/g, '\n\n').trim();

    // Get the next message order number
    const nextOrder = messages?.length ? Math.max(...messages.map(m => m.message_order)) + 1 : 1;

    // Save the moderator's message
    const { data: savedMessage, error: saveError } = await supabase
      .from('human_conversations')
      .insert([
        {
          project_id,
          human_respondent_id,
          message: cleanMessage,
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

    // If interview is complete, update the respondent status
    if (isComplete && respondent.status !== 'completed') {
      const { error: statusError } = await supabase
        .from('human_respondents')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', human_respondent_id);

      if (statusError) {
        console.error('Error updating interview status:', statusError);
        // Don't fail the request, just log the error
      }
    }

    return NextResponse.json({
      ...savedMessage,
      interview_completed: isComplete
    });
  } catch (error) {
    console.error('Error in AI moderator:', error);
    return NextResponse.json(
      { error: 'Failed to generate moderator response' },
      { status: 500 }
    );
  }
}
