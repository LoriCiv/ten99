import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define all routes that are publicly accessible and do not require a login.
// This includes the landing page, sign-in/up pages, API routes, and share pages.
const isPublicRoute = createRouteMatcher([
  '/', 
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/inbound',
  '/api/firebase-token',
  '/share/(.*)',
  '/profile/(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  // If the requested route is on our public list, allow the request to proceed
  // without any authentication checks.
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // For all other routes that are NOT on the public list, we will now
  // check for an authenticated user.
  const { userId } = await auth();

  // If the user is not logged in, redirect them to the sign-in page.
  if (!userId) {
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signInUrl);
  }

  // If the user is logged in, allow them to proceed to the protected route.
  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};