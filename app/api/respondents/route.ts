import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { searchParams } = new URL(request.url);

    // Get pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // TODO: Add filter parameters later
    // const status = searchParams.get('status');
    // const search = searchParams.get('search');
    // const simulationId = searchParams.get('simulation_id');

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error('Auth error:', userError);
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 401 }
      );
    }

    if (!user) {
      console.error('No user found');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get simulations owned by this user
    const simulationsQuery = supabase
      .from('simulations')
      .select('id')
      .eq('user_id', user.id);

    const { data: simulations, error: simError } = await simulationsQuery;

    if (simError) {
      throw simError;
    }

    if (!simulations || simulations.length === 0) {
      return NextResponse.json({
        respondents: [],
        total: 0,
        page,
        limit,
        totalPages: 0
      });
    }

    const simulationIds = simulations.map(s => s.id);

    // Build respondents query
    const respondentsQuery = supabase
      .from('human_respondents')
      .select(`
        *,
        simulation:simulations (
          id,
          topic
        )
      `)
      .in('simulation_id', simulationIds);

    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabase
      .from('human_respondents')
      .select('*', { count: 'exact', head: true })
      .in('simulation_id', simulationIds);
    if (countError) {
      throw countError;
    }
    // Get respondents with pagination
    const { data: respondents, error: respError } = await respondentsQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (respError) {
      console.error('Respondents query error:', respError);
      throw respError;
    }

    // Get message counts for each respondent
    const respondentsWithCounts = await Promise.all(
      respondents.map(async (respondent) => {
        const { count: messageCount, error: msgCountError } = await supabase
          .from('human_conversations')
          .select('*', { count: 'exact', head: true })
          .eq('human_respondent_id', respondent.id)
          .eq('simulation_id', respondent.simulation_id);

        // Get last message timestamp
        const { data: lastMessage, error: lastMsgError } = await supabase
          .from('human_conversations')
          .select('created_at')
          .eq('human_respondent_id', respondent.id)
          .eq('simulation_id', respondent.simulation_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        return {
          ...respondent,
          message_count: messageCount || 0,
          last_message_at: lastMessage?.created_at || null
        };
      })
    );

    return NextResponse.json({
      respondents: respondentsWithCounts,
      total: totalCount || 0,
      page,
      limit,
      totalPages: Math.ceil((totalCount || 0) / limit)
    });

  } catch (error) {
    console.error('Error fetching respondents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch respondents' },
      { status: 500 }
    );
  }
}
