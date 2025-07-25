import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { use } from 'react';

async function getSupabaseAndUser() {
  const supabase = createRouteHandlerClient({ cookies })
  const user = await supabase.auth.getUser()
  const userId = user?.data?.user?.id
  
  // Get user role if user exists
  let userData = null
  if (userId) {
    const { data } = await supabase.from('users').select('role').eq('id', userId).single()
    userData = data
  }
  console.log('query1112',userId, userData)
  
  return { supabase, userId, userData }
}

export async function GET(request: Request) {
  try {
    const { supabase, userId } = await getSupabaseAndUser()
     // Get the current session
     const { data: { session } } = await supabase.auth.getSession()
    
    
    // Fetch user's role from the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('user_id', session?.user?.id)
      .single()

    if (userError) {
      console.error("Error fetching user role:", userError)
      return NextResponse.json({ error: "Failed to fetch user role" }, { status: 500 })
    }

    let query = supabase.from('personas').select('*')
    
    // Only filter by user_id if the user is not an admin
    if (userData?.role !== 'admin') {
      query = query.or(`user_id.eq.${userId},user_id.is.null`)
    }
    
    // Add tag filtering if tags query parameter is provided
    const url = new URL(request.url);
    const tagsParam = url.searchParams.get('tags');
    
    if (tagsParam) {
      const tags = tagsParam.split(',').map(tag => tag.trim());
      // PostgreSQL array overlap operator - check if any of the requested tags exist in the persona's tags array
      query = query.overlaps('tags', tags);
    }
    
    console.log('query111',userId, userData, query)
    const { data, error } = await query

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
        location: personaData.location,
        archetype: personaData.archetype,
        bio: personaData.bio,
        traits: personaData.traits,
        goal: personaData.goal,
        attitude: personaData.attitude,
        family_status: personaData.family_status,
        education_level: personaData.education_level,
        income_level: personaData.income_level,
        lifestyle: personaData.lifestyle,
        category_products: personaData.category_products,
        product_relationship: personaData.product_relationship,
        category_habits: personaData.category_habits,
        tags: personaData.tags,
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

export async function DELETE(request: Request) {
  try {
    const { supabase, userId } = await getSupabaseAndUser();
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Persona id is required' }, { status: 400 });
    }

    // First check if this persona belongs to the user and is editable
    const { data: persona, error: fetchError } = await supabase
      .from('personas')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .eq('editable', true)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!persona) {
      return NextResponse.json({ error: 'Persona not found or not editable' }, { status: 404 });
    }

    // Delete the persona
    const { error: deleteError } = await supabase
      .from('personas')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Persona deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting persona:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete persona' },
      { status: 500 }
    );
  }
} 