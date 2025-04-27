import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

async function getSupabaseAndUser() {
  const supabase = createRouteHandlerClient({ cookies })
  const user = await supabase.auth.getUser()
  const userId = user?.data?.user?.id
  return { supabase, userId }
}

export async function GET() {
  try {
    const { supabase, userId } = await getSupabaseAndUser()
    
    const { data, error } = await supabase.from('personas').select('*').or(`user_id.eq.${userId},user_id.is.null`);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Unexpected error fetching personas:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, userId } = await getSupabaseAndUser()
    const personaData = await request.json();
    
    // Make sure we have the required fields
    if (!personaData.name || !personaData.occupation) {
      return NextResponse.json(
        { error: 'Name and occupation are required fields' },
        { status: 400 }
      );
    }

    personaData.user_id = userId
    personaData.editable = true

    // Insert the new persona into the database
    const { data, error } = await supabase
      .from('personas')
      .insert([personaData])
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data[0], { status: 201 });
  } catch (error: any) {
    console.error("Error creating persona:", error);
    return NextResponse.json(
      { error: error.message || 'Failed to create persona' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { supabase, userId } = await getSupabaseAndUser();
    const personaData = await request.json();
    if (!personaData.id) {
      return NextResponse.json({ error: 'Persona id is required' }, { status: 400 });
    }
    // Only allow updating personas that belong to the user
    const { data, error } = await supabase
      .from('personas')
      .update({
        name: personaData.name,
        age: personaData.age,
        gender: personaData.gender,
        occupation: personaData.occupation,
        archetype: personaData.archetype,
        bio: personaData.bio,
        traits: personaData.traits,
        goal: personaData.goal,
        attitude: personaData.attitude,
        editable: true
      })
      .eq('id', personaData.id)
      .eq('user_id', userId)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Persona not found or not editable' }, { status: 404 });
    }
    return NextResponse.json(data[0], { status: 200 });
  } catch (error: any) {
    console.error('Error updating persona:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update persona' },
      { status: 500 }
    );
  }
} 