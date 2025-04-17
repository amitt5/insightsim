import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data, error } = await supabase.from('personas').select('*');

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
    const supabase = createRouteHandlerClient({ cookies })
    const personaData = await request.json();
    
    // Make sure we have the required fields
    if (!personaData.name || !personaData.occupation) {
      return NextResponse.json(
        { error: 'Name and occupation are required fields' },
        { status: 400 }
      );
    }

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