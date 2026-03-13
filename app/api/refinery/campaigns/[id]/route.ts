import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// GET /api/refinery/campaigns/[id]
// Returns campaign + job + iterations for the results page.
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;

  const [campaignRes, jobRes, iterationsRes] = await Promise.all([
    supabase
      .from('refinery_campaigns')
      .select('id, name, content_type, status, iterations, users_per_iter')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single(),

    supabase
      .from('refinery_jobs')
      .select('status, current_iteration, total_iterations, error')
      .eq('campaign_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),

    supabase
      .from('refinery_iterations')
      .select('id, iteration_number, content, aggregate_score, improvement_notes, status')
      .eq('campaign_id', id)
      .order('iteration_number', { ascending: true }),
  ]);

  if (campaignRes.error || !campaignRes.data) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

  return NextResponse.json({
    campaign: campaignRes.data,
    job: jobRes.data ?? null,
    iterations: iterationsRes.data ?? [],
  });
}
