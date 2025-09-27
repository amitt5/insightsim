import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { project_id, name, age, gender, email } = body;

    // Validate required fields
    if (!project_id || !name || !age || !gender || !email) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate age
    if (age < 18 || age > 100) {
      return NextResponse.json(
        { error: 'Age must be between 18 and 100' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    // First verify that the project exists
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', project_id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    // Create new human respondent
    const { data: respondent, error: respondentError } = await supabase
      .from('human_respondents')
      .insert([
        {
          project_id,
          name,
          age,
          gender,
          email,
          status: 'in_progress'
        }
      ])
      .select()
      .single();

    if (respondentError) {
      throw respondentError;
    }

    return NextResponse.json(respondent);
  } catch (error) {
    console.error('Error creating human respondent:', error);
    return NextResponse.json(
      { error: 'Failed to create respondent' },
      { status: 500 }
    );
  }
}
