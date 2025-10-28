import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Update the respondent status to completed
    const { data, error } = await supabase
      .from('human_respondents')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Respondent not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Interview marked as completed',
      respondent: data
    });
  } catch (error) {
    console.error('Error updating respondent status:', error);
    return NextResponse.json(
      { error: 'Failed to update interview status' },
      { status: 500 }
    );
  }
}
