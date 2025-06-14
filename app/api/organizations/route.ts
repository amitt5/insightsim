import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { logError } from '@/utils/errorLogger';

// GET - Fetch current user's organization
export async function GET(request: Request) {
  let userId: string | undefined;
  
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      await logError(
        'organizations_api_session_error',
        sessionError,
        undefined,
        { endpoint: 'GET /api/organizations' }
      );
      return NextResponse.json({ error: 'Authentication error' }, { status: 401 });
    }

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    userId = session.user.id;

    // Fetch organization data
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (orgError) {
      await logError(
        'organizations_api_fetch_error',
        orgError,
        undefined,
        { 
          user_id: session.user.id,
          error_code: orgError.code,
          error_details: orgError.details
        },
        userId
      );
      
      // If organization not found, return default values
      if (orgError.code === 'PGRST116') {
        return NextResponse.json({
          name: '',
          industry: '',
          website: '',
          description: '',
          logo_url: '',
          primary_color: '#3B82F6',
          secondary_color: '#64748B',
          font_family: 'Inter',
          include_logo: true,
          show_participant_details: true,
          executive_summary: true,
          default_report_format: 'PDF'
        });
      }
      
      return NextResponse.json({ error: orgError.message }, { status: 500 });
    }

    return NextResponse.json(organization);

  } catch (error) {
    console.error('Unexpected error in GET /api/organizations:', error);
    
    await logError(
      'organizations_api_get_unexpected_error',
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

// POST - Create new organization
export async function POST(request: Request) {
  let userId: string | undefined;
  
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      await logError(
        'organizations_api_session_error',
        sessionError,
        undefined,
        { endpoint: 'POST /api/organizations' }
      );
      return NextResponse.json({ error: 'Authentication error' }, { status: 401 });
    }

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    userId = session.user.id;

    // Parse request body
    const orgData = await request.json();
    
    // Validate required fields
    if (!orgData.name) {
      return NextResponse.json({ error: 'Organization name is required' }, { status: 400 });
    }

    // Create organization
    const { data: newOrganization, error: createError } = await supabase
      .from('organizations')
      .insert({
        user_id: session.user.id,
        name: orgData.name,
        industry: orgData.industry || null,
        website: orgData.website || null,
        description: orgData.description || null,
        logo_url: orgData.logo_url || null,
        primary_color: orgData.primary_color || '#3B82F6',
        secondary_color: orgData.secondary_color || '#64748B',
        font_family: orgData.font_family || 'Inter',
        include_logo: orgData.include_logo !== undefined ? orgData.include_logo : true,
        show_participant_details: orgData.show_participant_details !== undefined ? orgData.show_participant_details : true,
        executive_summary: orgData.executive_summary !== undefined ? orgData.executive_summary : true,
        default_report_format: orgData.default_report_format || 'PDF'
      })
      .select()
      .single();

    if (createError) {
      await logError(
        'organizations_api_create_error',
        createError,
        JSON.stringify(orgData),
        { 
          user_id: session.user.id,
          error_code: createError.code,
          error_details: createError.details
        },
        userId
      );
      
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    return NextResponse.json(newOrganization, { status: 201 });

  } catch (error) {
    console.error('Unexpected error in POST /api/organizations:', error);
    
    await logError(
      'organizations_api_post_unexpected_error',
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

// PATCH - Update organization
export async function PATCH(request: Request) {
  let userId: string | undefined;
  
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      await logError(
        'organizations_api_session_error',
        sessionError,
        undefined,
        { endpoint: 'PATCH /api/organizations' }
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
    const allowedFields = [
      'name', 'industry', 'website', 'description', 'logo_url',
      'primary_color', 'secondary_color', 'font_family',
      'include_logo', 'show_participant_details', 'executive_summary',
      'default_report_format'
    ];
    
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

    // Check if organization exists
    const { data: existingOrg, error: checkError } = await supabase
      .from('organizations')
      .select('id')
      .eq('user_id', session.user.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      await logError(
        'organizations_api_check_error',
        checkError,
        undefined,
        { 
          user_id: session.user.id,
          error_code: checkError.code,
          error_details: checkError.details
        },
        userId
      );
      
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }

    let result;

    if (!existingOrg) {
      // Create new organization if it doesn't exist
      const { data: newOrganization, error: createError } = await supabase
        .from('organizations')
        .insert({
          user_id: session.user.id,
          ...sanitizedData
        })
        .select()
        .single();

      if (createError) {
        await logError(
          'organizations_api_create_on_update_error',
          createError,
          JSON.stringify(sanitizedData),
          { 
            user_id: session.user.id,
            error_code: createError.code,
            error_details: createError.details
          },
          userId
        );
        
        return NextResponse.json({ error: createError.message }, { status: 500 });
      }

      result = newOrganization;
    } else {
      // Update existing organization
      const { data: updatedOrganization, error: updateError } = await supabase
        .from('organizations')
        .update(sanitizedData)
        .eq('user_id', session.user.id)
        .select()
        .single();

      if (updateError) {
        await logError(
          'organizations_api_update_error',
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

      result = updatedOrganization;
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Unexpected error in PATCH /api/organizations:', error);
    
    await logError(
      'organizations_api_patch_unexpected_error',
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