import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Fetch simulation data
    const { data: simulation, error: simulationError } = await supabase
      .from('simulations')
      .select('*')
      .eq('id', params.id)
      .single();

    if (simulationError) {
      throw simulationError;
    }

   

    return NextResponse.json({
      simulation,
      personas:  []
    });
  } catch (error) {
    console.error('Error fetching simulation:', error);
    return NextResponse.json({ error: 'Failed to fetch simulation data' }, { status: 500 });
  }
}
