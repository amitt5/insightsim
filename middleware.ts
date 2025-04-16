import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

// Make sure to export the middleware function correctly
export default async function middleware(req: NextRequest) {
  // Create a response object that we'll use to continue the response
  const res = NextResponse.next()

  // Create a Supabase client with the request and response
  const supabase = createMiddlewareClient({ req, res })

  // Check if the user is authenticated
  const { data: { session } } = await supabase.auth.getSession()

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
  if (isPathProtected && !session) {
    const redirectUrl = new URL('/login', req.url)
    // Add the current URL as a callback parameter
    redirectUrl.searchParams.set('callbackUrl', path)
    return NextResponse.redirect(redirectUrl)
  }

  // If the user is already logged in and trying to access login/signup pages, redirect to home
  if (session && (path === '/login' || path === '/signup')) {
    return NextResponse.redirect(new URL('/', req.url))
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