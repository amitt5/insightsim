import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Exchange the code for a session
    const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
    console.log("Session data777:", session);
    if (sessionError) {
      console.error('Session error:', sessionError);
      return NextResponse.redirect(`${requestUrl.origin}/login?error=Could not authenticate user`);
    }

    if (session?.user) {
      try {
        // Check if user profile already exists
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('user_id', session.user.id)
          .single();

        if (!existingUser) {
          // Get user info from the session
          const { user } = session;
          
          // Create user profile in public.users
          const { error: profileError } = await supabase
            .from('users')
            .insert({
              user_id: user.id,
              email: user.email,
              first_name: user.user_metadata?.full_name?.split(' ')[0] || '',
              last_name: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
              role: 'researcher',
            });

          if (profileError) {
            console.error('Error creating user profile:', profileError);
            // Continue with redirect even if profile creation fails
            // The user can complete their profile later
          }
        }
      } catch (error) {
        console.error('Error in profile creation:', error);
        // Continue with redirect even if profile creation fails
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${requestUrl.origin}/simulations`);
} 