import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Fetch human respondent data along with their simulation
    const { data: respondent, error: respondentError } = await supabase
      .from('human_respondents')
      .select(`
        *,
        simulation:simulations (
          id,
          topic,
          discussion_questions,
          created_at
        )
      `)
      .eq('id', params.id)
      .single();

    if (respondentError) {
      throw respondentError;
    }

    if (!respondent) {
      return NextResponse.json(
        { error: 'Respondent not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(respondent);
  } catch (error) {
    console.error('Error fetching respondent:', error);
    return NextResponse.json(
      { error: 'Failed to fetch respondent data' },
      { status: 500 }
    );
  }
}
