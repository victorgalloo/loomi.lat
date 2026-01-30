import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Public routes that don't need Supabase authentication
  const publicRoutes = [
    '/',           // Landing page
    '/syntra',     // Syntra landing and subpages
    '/db-anthana', // Databricks landing page
    '/loomi',      // Loomi AI agent landing page
  ];

  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // Skip Supabase session check for public routes
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // For protected routes (dashboard, login, etc.), use Supabase middleware
  return await updateSession(request);
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
