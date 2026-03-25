import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// GET /api/refinery/campaigns/[id]/iteration?n=1
// Returns synthetic users with their score + feedback for iteration n.
export async function GET(
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
  const n = Number(new URL(req.url).searchParams.get('n') ?? '1');

  // Get the iteration row
  const { data: iteration, error: iterError } = await supabase
    .from('refinery_iterations')
    .select('id')
    .eq('campaign_id', id)
    .eq('iteration_number', n)
    .single();

  if (iterError || !iteration) {
    return NextResponse.json({ users: [] });
  }

  // Get all responses for this iteration, joined with synthetic user data
  const { data: responses, error: respError } = await supabase
    .from('refinery_responses')
    .select(`
      score,
      feedback,
      personalized_content,
      refinery_synthetic_users (
        id, name, age, gender, profession, bio
      )
    `)
    .eq('iteration_id', iteration.id);

  if (respError) {
    return NextResponse.json({ error: respError.message }, { status: 500 });
  }

  const users = (responses ?? []).map((r) => {
    const u = r.refinery_synthetic_users as {
      id: string; name: string; age: number | null;
      gender: string | null; profession: string | null; bio: string | null;
    } | null;
    return {
      id: u?.id ?? '',
      name: u?.name ?? 'Unknown',
      age: u?.age ?? null,
      gender: u?.gender ?? null,
      profession: u?.profession ?? null,
      bio: u?.bio ?? null,
      score: r.score,
      feedback: r.feedback,
      personalizedContent: r.personalized_content ?? null,
    };
  });

  return NextResponse.json({ users });
}
