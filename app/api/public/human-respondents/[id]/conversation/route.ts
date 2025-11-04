import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const respondentId = params.id;
    const body = await request.json();
    const conversation = body?.conversation;

    if (!respondentId) {
      return NextResponse.json({ error: 'Missing respondent id' }, { status: 400 });
    }
    if (!Array.isArray(conversation)) {
      return NextResponse.json({ error: 'conversation must be an array' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('human_respondents')
      .update({ conversation, updated_at: new Date().toISOString() })
      .eq('id', respondentId)
      .select('id')
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (error) {
    console.error('Failed to save conversation:', error);
    return NextResponse.json({ error: 'Failed to save conversation' }, { status: 500 });
  }
}


