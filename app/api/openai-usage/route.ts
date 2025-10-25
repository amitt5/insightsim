import { NextResponse } from 'next/server';
import { logError } from '@/utils/errorLogger';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET() {
  let userId: string | undefined;
  
  try {
    // Get user ID for error logging
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    userId = session?.user?.id;

    // Check if OpenAI Admin API key is configured
    if (!process.env.OPENAI_ADMIN_API_KEY) {
      await logError(
        'openai_usage_api',
        'OpenAI Admin API key not configured',
        '',
        { error_type: 'configuration_error' },
        userId
      );
      return NextResponse.json(
        { error: 'OpenAI Admin API key not configured' },
        { status: 500 }
      );
    }

    // Check if OpenAI Organization ID is configured
    if (!process.env.OPENAI_ORGANIZATION_ID) {
      await logError(
        'openai_usage_api',
        'OpenAI Organization ID not configured',
        '',
        { error_type: 'configuration_error' },
        userId
      );
      return NextResponse.json(
        { error: 'OpenAI Organization ID not configured. Please add OPENAI_ORGANIZATION_ID to your environment variables.' },
        { status: 500 }
      );
    }

    // Calculate time range for past week
    const now = Math.floor(Date.now() / 1000); // Current time in Unix seconds
    const oneWeekAgo = now - (7 * 24 * 60 * 60); // 7 days ago in Unix seconds

    // Build query parameters
    const params = new URLSearchParams({
      start_time: oneWeekAgo.toString(),
      end_time: now.toString(),
      bucket_width: '1d',
      limit: '7',
    });

    params.append('group_by', 'model');

    // Call OpenAI Usage API
    const response = await fetch(`https://api.openai.com/v1/organization/usage/completions?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_ADMIN_API_KEY}`,
        'OpenAI-Organization': process.env.OPENAI_ORGANIZATION_ID,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI Usage API error:', response.status, errorText);
      console.error('Request URL:', `https://api.openai.com/v1/organization/usage/completions?${params}`);
      console.error('Headers sent:', {
        'Authorization': `Bearer ${process.env.OPENAI_ADMIN_API_KEY?.substring(0, 10)}...`,
        'OpenAI-Organization': process.env.OPENAI_ORGANIZATION_ID,
        'Content-Type': 'application/json'
      });
      
      await logError(
        'openai_usage_api',
        `OpenAI API returned ${response.status}: ${errorText}`,
        errorText,
        {
          status: response.status,
          statusText: response.statusText,
          error_type: 'api_error',
          has_admin_api_key: !!process.env.OPENAI_ADMIN_API_KEY,
          has_org_id: !!process.env.OPENAI_ORGANIZATION_ID,
          request_url: `https://api.openai.com/v1/organization/usage/completions?${params}`
        },
        userId
      );

      let errorMessage = `Failed to fetch usage data: ${response.status} ${response.statusText}`;
      if (response.status === 401) {
        errorMessage += '. Please check your OpenAI Admin API key and Organization ID configuration.';
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    const usageData = await response.json();
    
    // Log successful API call
    console.log('OpenAI Usage API response:', usageData);

    return NextResponse.json({
      success: true,
      data: usageData,
      period: 'past_week',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error calling OpenAI Usage API:', error);
    
    await logError(
      'openai_usage_api',
      error instanceof Error ? error.message : String(error),
      '',
      {
        error_type: error instanceof Error ? error.name : 'unknown_error',
        timestamp: new Date().toISOString()
      },
      userId
    );

    return NextResponse.json(
      { error: 'Failed to fetch usage data' },
      { status: 500 }
    );
  }
}
