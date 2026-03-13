import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// GET /api/refinery/campaigns
// GET /api/refinery/campaigns?id=xxx — returns a single campaign
// GET /api/refinery/campaigns        — returns all campaigns for the current user, newest first
export async function GET(req: Request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (id) {
    const { data: campaign, error } = await supabase
      .from('refinery_campaigns')
      .select('*')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();

    if (error || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    return NextResponse.json({ campaign });
  }

  const { data: campaigns, error } = await supabase
    .from('refinery_campaigns')
    .select('id, name, content_type, status, iterations, users_per_iter, created_at')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ campaigns });
}

// PATCH /api/refinery/campaigns?id=xxx — updates an existing draft campaign
export async function PATCH(req: Request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const body = await req.json();
  const { launch, ...fields } = body as { launch: boolean; [key: string]: unknown };

  const { error } = await supabase
    .from('refinery_campaigns')
    .update({ ...fields, status: launch ? 'pending' : 'draft' })
    .eq('id', id)
    .eq('user_id', session.user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (launch) {
    const { error: jobError } = await supabase
      .from('refinery_jobs')
      .insert({
        campaign_id: id,
        status: 'pending',
        current_iteration: 0,
        total_iterations: fields.iterations,
      });

    if (jobError) {
      return NextResponse.json({ error: jobError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ campaignId: id });
}

// POST /api/refinery/campaigns
// Creates a new refinery campaign. Pass { ...campaignFields, launch: boolean }.
// If launch=true, also creates a refinery_jobs row and returns jobId.
export async function POST(req: Request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { launch, ...campaignFields } = body as {
    launch: boolean;
    name: string;
    content_type: string;
    initial_draft: string | null;
    icp: string;
    rag_text: string | null;
    rag_files: unknown[];
    metrics: string[];
    extra_context: string | null;
    iterations: number;
    users_per_iter: number;
  };

  const { data: campaign, error: campaignError } = await supabase
    .from('refinery_campaigns')
    .insert({
      user_id: session.user.id,
      status: launch ? 'pending' : 'draft',
      ...campaignFields,
    })
    .select('id')
    .single();

  if (campaignError) {
    console.error('[POST /api/refinery/campaigns]', campaignError);
    return NextResponse.json({ error: campaignError.message }, { status: 500 });
  }

  if (!launch) {
    return NextResponse.json({ campaignId: campaign.id });
  }

  const { error: jobError } = await supabase
    .from('refinery_jobs')
    .insert({
      campaign_id: campaign.id,
      status: 'pending',
      current_iteration: 0,
      total_iterations: campaignFields.iterations,
    });

  if (jobError) {
    console.error('[POST /api/refinery/campaigns] job insert error', jobError);
    return NextResponse.json({ error: jobError.message }, { status: 500 });
  }

  return NextResponse.json({ campaignId: campaign.id });
}
