import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase.from('personas').select('*');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
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
    return NextResponse.json(
      { error: error.message || 'Failed to create persona' },
      { status: 500 }
    );
  }
} 