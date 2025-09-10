import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const body = await request.json();
    const { status } = body;

    // Validate status
    if (!status || !['in_progress', 'completed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "in_progress" or "completed"' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // First, get the respondent to verify ownership
    const { data: respondent, error: respError } = await supabase
      .from('human_respondents')
      .select(`
        *,
        simulation:simulations (
          user_id
        )
      `)
      .eq('id', params.id)
      .single();

    if (respError || !respondent) {
      return NextResponse.json(
        { error: 'Respondent not found' },
        { status: 404 }
      );
    }

    // Verify the simulation belongs to the authenticated user
    if (respondent.simulation.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to modify this respondent' },
        { status: 403 }
      );
    }

    // Update the status
    const { data: updatedRespondent, error: updateError } = await supabase
      .from('human_respondents')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json(updatedRespondent);
  } catch (error) {
    console.error('Error updating respondent status:', error);
    return NextResponse.json(
      { error: 'Failed to update respondent status' },
      { status: 500 }
    );
  }
}
