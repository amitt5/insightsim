import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { VoiceSession } from '@/types/database';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      project_id, 
      human_respondent_id, 
      vapi_call_id,
      assistant_id,
      metadata = {}
    } = body;

    if (!project_id || !human_respondent_id) {
      return NextResponse.json(
        { error: 'Missing required fields: project_id and human_respondent_id' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Validate that project and human respondent exist
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', project_id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: `Project with id ${project_id} not found` },
        { status: 404 }
      );
    }

    const { data: respondent, error: respondentError } = await supabase
      .from('human_respondents')
      .select('id')
      .eq('id', human_respondent_id)
      .single();

    if (respondentError || !respondent) {
      return NextResponse.json(
        { error: `Human respondent with id ${human_respondent_id} not found` },
        { status: 404 }
      );
    }

    // Create new voice session
    const { data: newSession, error: insertError } = await supabase
      .from('voice_sessions')
      .insert([
        {
          project_id,
          human_respondent_id,
          status: 'started',
          vapi_call_id,
          assistant_id,
          metadata,
          started_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Voice session insert error:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        data: { project_id, human_respondent_id, vapi_call_id, assistant_id }
      });
      
      // Return specific error information
      return NextResponse.json(
        { 
          error: 'Failed to create voice session',
          details: insertError.message,
          code: insertError.code
        },
        { status: 500 }
      );
    }

    return NextResponse.json(newSession);
  } catch (error) {
    console.error('Error creating voice session:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create voice session',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const human_respondent_id = searchParams.get('human_respondent_id');
    const project_id = searchParams.get('project_id');
    const status = searchParams.get('status');

    if (!human_respondent_id || !project_id) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Build query
    let query = supabase
      .from('voice_sessions')
      .select('*')
      .eq('human_respondent_id', human_respondent_id)
      .eq('project_id', project_id);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: sessions, error: sessionsError } = await query
      .order('created_at', { ascending: false });

    if (sessionsError) {
      console.error('Error fetching voice sessions:', sessionsError);
      return NextResponse.json(
        { 
          error: 'Failed to fetch voice sessions',
          details: sessionsError.message,
          code: sessionsError.code
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ sessions: sessions || [] });
  } catch (error) {
    console.error('Error fetching voice sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch voice sessions' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { 
      session_id, 
      status, 
      ended_at,
      metadata = {}
    } = body;

    if (!session_id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: session_id and status' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Update session
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
      ...metadata
    };

    if (ended_at) {
      updateData.ended_at = ended_at;
    }

    const { data: updatedSession, error: updateError } = await supabase
      .from('voice_sessions')
      .update(updateData)
      .eq('id', session_id)
      .select()
      .single();

    if (updateError) {
      console.error('Voice session update error:', {
        code: updateError.code,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        session_id
      });
      
      return NextResponse.json(
        { 
          error: 'Failed to update voice session',
          details: updateError.message,
          code: updateError.code
        },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error('Error updating voice session111:', error);
    return NextResponse.json(
      { error: 'Failed to update voice session111' },
      { status: 500 }
    );
  }
}
