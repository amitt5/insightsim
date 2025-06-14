import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

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