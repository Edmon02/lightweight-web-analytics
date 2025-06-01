import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Check for authentication cookie
  const authCookie = request.cookies.get('lwa_auth');
  
  // If accessing dashboard and not authenticated
  if (
    request.nextUrl.pathname.startsWith('/dashboard') &&
    !request.nextUrl.pathname.startsWith('/dashboard/api') &&
    !authCookie
  ) {
    // Check if environment variables are set for auth
    const username = process.env.DASHBOARD_USERNAME;
    const password = process.env.DASHBOARD_PASSWORD;
    
    // If credentials are set, redirect to login
    if (username && password) {
      // Allow access to login page
      if (request.nextUrl.pathname === '/dashboard') {
        return NextResponse.next();
      }
      
      // Redirect other dashboard pages to login
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*']
};
