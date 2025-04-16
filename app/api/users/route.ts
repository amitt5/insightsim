import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const userData = await request.json();
    console.log("Received user data:", JSON.stringify(userData));
    
    // Make sure we have the required fields
    if (!userData.auth_id || !userData.email) {
      console.log("Missing required fields:", { auth_id: userData.auth_id, email: userData.email });
      return NextResponse.json(
        { error: 'Auth ID and email are required fields' },
        { status: 400 }
      );
    }

    // First, let's try to understand the table structure
    console.log("Examining users table structure");
    const { data: tableInfo, error: tableError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error("Error examining users table:", tableError);
    } else {
      // Log the structure of the first row to see column names
      if (tableInfo && tableInfo.length > 0) {
        console.log("Users table structure:", Object.keys(tableInfo[0]));
        // If we have a row, we can see what role value is already used
        if (tableInfo[0].role) {
          console.log("Existing role value in table:", tableInfo[0].role);
        }
      } else {
        console.log("Users table appears to be empty");
        
        // Try to query the schema for the role check constraint
        try {
          const { data: schemaInfo, error: schemaError } = await supabase.rpc(
            'get_role_enum_values',
            { table_name: 'users', column_name: 'role' }
          );
          
          if (schemaError) {
            console.error("Error querying schema:", schemaError);
          } else if (schemaInfo) {
            console.log("Valid role values from schema:", schemaInfo);
          }
        } catch (err) {
          console.log("Could not query schema info:", err);
        }
      }
    }

    // Check if user already exists in the custom users table
    console.log("Checking if user exists using user_id:", userData.auth_id);
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userData.auth_id)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is the "not found" error code
      console.error("Error checking for existing user:", checkError);
      return NextResponse.json(
        { error: checkError.message },
        { status: 500 }
      );
    }
    
    // If user already exists, return that user
    if (existingUser) {
      console.log("User already exists:", existingUser);
      return NextResponse.json(existingUser);
    }
    
    // Insert the new user into the users table
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
    return NextResponse.json(
      { error: error.message || 'Failed to create user profile' },
      { status: 500 }
    );
  }
} 