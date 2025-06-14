import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { logError } from '@/utils/errorLogger';

// GET - Fetch current user profile
export async function GET(request: Request) {
  let userId: string | undefined;
  
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      await logError(
        'users_api_session_error',
        sessionError,
        undefined,
        { endpoint: 'GET /api/users' }
      );
      return NextResponse.json({ error: 'Authentication error' }, { status: 401 });
    }

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    userId = session.user.id;

    // Fetch user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('first_name, last_name, email, company, role, created_at, updated_at')
      .eq('user_id', session.user.id)
      .single();

    if (profileError) {
      await logError(
        'users_api_fetch_profile_error',
        profileError,
        undefined,
        { 
          user_id: session.user.id,
          error_code: profileError.code,
          error_details: profileError.details
        },
        userId
      );
      
      // If user not found, return auth data
      if (profileError.code === 'PGRST116') {
        return NextResponse.json({
          first_name: '',
          last_name: '',
          email: session.user.email || '',
          company: '',
          role: 'researcher'
        });
      }
      
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json(userProfile);

  } catch (error) {
    console.error('Unexpected error in GET /api/users:', error);
    
    await logError(
      'users_api_get_unexpected_error',
      error instanceof Error ? error : String(error),
      undefined,
      { 
        user_id: userId,
        error_type: 'unexpected_error'
      },
      userId
    );
    
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// PATCH - Update user profile
export async function PATCH(request: Request) {
  let userId: string | undefined;
  
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      await logError(
        'users_api_session_error',
        sessionError,
        undefined,
        { endpoint: 'PATCH /api/users' }
      );
      return NextResponse.json({ error: 'Authentication error' }, { status: 401 });
    }

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    userId = session.user.id;

    // Parse request body
    const updateData = await request.json();
    
    // Validate and sanitize update data
    const allowedFields = ['first_name', 'last_name', 'company'];
    const sanitizedData: any = {};
    
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        sanitizedData[field] = updateData[field];
      }
    }
    
    // Add updated timestamp
    sanitizedData.updated_at = new Date().toISOString();

    if (Object.keys(sanitizedData).length === 1) { // Only updated_at
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Update user profile
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(sanitizedData)
      .eq('user_id', session.user.id)
      .select('first_name, last_name, email, company, role, updated_at')
      .single();

    if (updateError) {
      await logError(
        'users_api_update_profile_error',
        updateError,
        JSON.stringify(sanitizedData),
        { 
          user_id: session.user.id,
          error_code: updateError.code,
          error_details: updateError.details
        },
        userId
      );
      
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json(updatedUser);

  } catch (error) {
    console.error('Unexpected error in PATCH /api/users:', error);
    
    await logError(
      'users_api_patch_unexpected_error',
      error instanceof Error ? error : String(error),
      undefined,
      { 
        user_id: userId,
        error_type: 'unexpected_error'
      },
      userId
    );
    
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Parse the request body
    const userData = await request.json();

    // Validate required fields
    if (!userData.auth_id || !userData.email) {
      return NextResponse.json({ error: "User ID and email are required" }, { status: 400 });
    }

    console.log("Received user data:", userData);

    try {
      // Check if the user already exists
      const { data: existingUsers, error: queryError } = await supabase
        .from('users')
        .select()
        .eq('user_id', userData.auth_id)
        .limit(1);

      if (queryError) {
        console.error("Error querying for existing user:", queryError);
        return NextResponse.json({ error: queryError.message }, { status: 500 });
      }

      if (existingUsers && existingUsers.length > 0) {
        console.log("User already exists:", existingUsers[0]);
        return NextResponse.json(existingUsers[0], { status: 200 });
      }
      
      // Create new user
      console.log('Creating new user with fields:', {
        user_id: userData.auth_id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: 'researcher'
      });

      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          user_id: userData.auth_id,
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          company: userData.company,
          role: 'researcher'
        })
        .select();

      if (insertError) {
        console.error("Error creating user in database:", insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      console.log("Successfully created user:", newUser?.[0]);
      return NextResponse.json(newUser[0], { status: 201 });
    } catch (error: any) {
      console.error("Unexpected error in user creation:", error);
      return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Error processing request:", error);
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 });
  }
} 