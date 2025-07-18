import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

// Make sure to export the middleware function correctly
export default async function middleware(req: NextRequest) {
  // Create a response object that we'll use to continue the response
  let res = NextResponse.next()

  try {
    // Create a Supabase client with the request and response
    const supabase = createMiddlewareClient({ req, res })

    // Check if the user is authenticated
    const { data } = await supabase.auth.getSession()
    console.log("Middleware session check:123", data)
    console.log("Middleware session check:", {
      sessionExists: data.session ? true : false,
      cookiesAvailable: Object.keys(req.cookies).length > 0,
      cookieNames: Object.keys(req.cookies),
    })
    
    // Define which paths require auth
    const protectedPaths = [
      '/simulations',
      '/personas',
      '/settings',
    ]

    // Check if the current path requires authentication
    const path = req.nextUrl.pathname
    const isPathProtected = protectedPaths.some(
      (protectedPath) => path === protectedPath || path.startsWith(`${protectedPath}/`)
    )

    // If the path is protected and the user isn't authenticated, redirect to login
    if (isPathProtected && !data.session) {
      // Log unauthorized access attempt
      try {
        await fetch(`${req.nextUrl.origin}/api/error-logs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            source: 'middleware_auth_check',
            error_message: 'Unauthorized access attempt to protected route',
            metadata: {
              path,
              user_agent: req.headers.get('user-agent'),
              ip: req.headers.get('x-forwarded-for') || 'unknown',
              timestamp: new Date().toISOString()
            }
          })
        });
      } catch (logError) {
        console.error('Failed to log unauthorized access:', logError);
      }
      
      const redirectUrl = new URL('/login', req.url)
      // Add the current URL as a callback parameter
      redirectUrl.searchParams.set('callbackUrl', path)
      return NextResponse.redirect(redirectUrl)
    }

    // If the user is already logged in and trying to access login/signup pages, redirect to home
    if (data.session && (path === '/login' || path === '/signup')) {
      return NextResponse.redirect(new URL('/simulations', req.url))
    }
  } catch (error) {
    console.error("Error in middleware:", error)
    
    // Log middleware error
    try {
      await fetch(`${req.nextUrl.origin}/api/error-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: 'middleware_error',
          error_message: error instanceof Error ? error.message : String(error),
          metadata: {
            path: req.nextUrl.pathname,
            user_agent: req.headers.get('user-agent'),
            error_type: error instanceof Error ? error.name : 'unknown_error',
            timestamp: new Date().toISOString()
          }
        })
      });
    } catch (logError) {
      console.error('Failed to log middleware error:', logError);
    }
  }

  return res
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    // Match all paths except static files, api routes, and _next
    '/((?!_next/static|_next/image|favicon.ico|.*\\.|api).*)',
  ],
} 