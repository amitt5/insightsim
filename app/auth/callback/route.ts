import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// auth/callback/route.ts
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (sessionError) {
        console.error('Session error:', sessionError)
        return NextResponse.redirect(`${requestUrl.origin}/login?error=Could not authenticate user`)
      }

      if (session?.user) {
        // Check if user profile already exists
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('user_id', session.user.id)
          .single()

        if (!existingUser) {
          const { user } = session
          
          // Create user profile
          const { error: profileError } = await supabase
            .from('users')
            .insert({
              user_id: user.id,
              email: user.email,
              first_name: user.user_metadata?.full_name?.split(' ')[0] || '',
              last_name: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
              role: 'researcher',
              // ADD COMPANY SUPPORT for future enterprise features
              company: user.user_metadata?.company || null,
            })

          if (profileError) {
            console.error('Error creating user profile:', profileError)
          } else {
            // CREATE INITIAL CREDITS
            const { error: creditsError } = await supabase
              .from('user_credits')
              .insert({
                user_id: user.id,
                credits: 500,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })

            if (creditsError) {
              console.error('Error creating initial credits:', creditsError)
            } else {
              console.log('✅ User profile and credits created for Google user')
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in OAuth callback:', error)
      return NextResponse.redirect(`${requestUrl.origin}/login?error=Authentication failed`)
    }
  }

  return NextResponse.redirect(`${requestUrl.origin}/simulations`)
}
