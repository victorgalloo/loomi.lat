import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Public routes that don't need authentication
  const publicRoutes = [
    '/',           // Landing page
    '/syntra',     // Syntra landing and subpages
    '/db-anthana', // Databricks landing page
    '/loomi',      // Loomi AI agent landing page
    '/login',      // Login page
    '/api',        // API routes handle their own auth
    '/privacy-policy',
    '/eliminacion',
    '/investors',
    '/selected-work',
    '/pay',
  ];

  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // Skip auth check for public routes
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // For protected routes (dashboard), check for Supabase auth cookie
  // The cookie name follows the pattern: sb-<project-ref>-auth-token
  const authCookie = request.cookies.getAll().find(cookie =>
    cookie.name.includes('auth-token') || cookie.name.includes('sb-')
  );

  // If no auth cookie and trying to access protected route, redirect to login
  if (!authCookie && pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectedFrom', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
