import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// POST /api/refinery/campaigns/[id]/extend
// Adds more iterations to a completed campaign and queues a new job.
// Body: { count: number }
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;
  const body = await req.json() as { count?: number };
  const count = typeof body.count === 'number' && body.count > 0 ? Math.min(body.count, 10) : 3;

  // Load campaign (verify ownership)
  const { data: campaign, error: campaignError } = await supabase
    .from('refinery_campaigns')
    .select('id, iterations, status')
    .eq('id', id)
    .eq('user_id', session.user.id)
    .single();

  if (campaignError || !campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

  const newTotal = campaign.iterations + count;

  // Update campaign: more iterations, back to running
  await supabase
    .from('refinery_campaigns')
    .update({ iterations: newTotal, status: 'running' })
    .eq('id', id);

  // Insert a new pending job
  const { data: job, error: jobError } = await supabase
    .from('refinery_jobs')
    .insert({
      campaign_id: id,
      status: 'pending',
      total_iterations: newTotal,
      current_iteration: campaign.iterations, // already completed this many
    })
    .select('id')
    .single();

  if (jobError || !job) {
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, newTotal, jobId: job.id });
}
