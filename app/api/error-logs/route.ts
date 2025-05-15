import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// Interface for error log data
interface ErrorLogData {
  source: string;
  error_message?: string;
  response_string?: string;
  metadata?: any;
  user_id?: string;
}

export async function POST(request: Request) {
  try {
    // Set up Supabase client and get user
    const supabase = createRouteHandlerClient({ cookies });
    const user = await supabase.auth.getUser();
    const userId = user?.data?.user?.id;
    
    // Get error data from request
    const errorData: ErrorLogData = await request.json();
    
    // Validate required fields
    if (!errorData.source) {
      return NextResponse.json(
        { error: 'Source field is required' },
        { status: 400 }
      );
    }
    
    // Use the user_id from the request if provided, otherwise use the authenticated user's ID
    const logUserId = errorData.user_id || userId;
    
    // Prepare data for database
    const logEntry = {
      user_id: logUserId,
      source: errorData.source,
      error_message: errorData.error_message || null,
      response_string: errorData.response_string || null,
      metadata: errorData.metadata || null
    };
    
    // Insert the error log
    const { data, error } = await supabase
      .from('error_logs')
      .insert([logEntry])
      .select();
      
    if (error) {
      console.error('Failed to log error to database:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to log error' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Error logged successfully',
      data: data[0]
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Error in error logging endpoint:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// Optionally allow retrieving error logs for admin users
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const user = await supabase.auth.getUser();
    const userId = user?.data?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get query parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const source = url.searchParams.get('source');
    
    // Build query
    let query = supabase
      .from('error_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
      
    // Add source filter if provided
    if (source) {
      query = query.eq('source', source);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data);
    
  } catch (error: any) {
    console.error('Error fetching error logs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch error logs' },
      { status: 500 }
    );
  }
} 