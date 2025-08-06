import { NextRequest, NextResponse } from 'next/server';
import { createTracingMiddleware } from '@/middleware/tracing';
import { locales, defaultLocale } from '@/i18n/config';

// Create the tracing middleware
const tracingMiddleware = createTracingMiddleware();

function getLocale(request: NextRequest): string {
  // Check if locale is in pathname
  const pathname = request.nextUrl.pathname;
  const pathnameIsMissingLocale = locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  if (pathnameIsMissingLocale) {
    // Get locale from Accept-Language header
    const acceptLanguage = request.headers.get('accept-language');
    if (acceptLanguage) {
      for (const locale of locales) {
        if (acceptLanguage.includes(locale)) {
          return locale;
        }
      }
    }
    return defaultLocale;
  }

  // Extract locale from pathname
  const segments = pathname.split('/');
  return segments[1] || defaultLocale;
}

export async function middleware(request: NextRequest) {
  // Handle internationalization
  const pathname = request.nextUrl.pathname;
  const pathnameIsMissingLocale = locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  // Redirect if there is no locale
  if (pathnameIsMissingLocale) {
    const locale = getLocale(request);
    
    // Don't redirect API routes or static files
    if (
      pathname.startsWith('/api/') ||
      pathname.startsWith('/_next/') ||
      pathname.includes('.')
    ) {
      // Apply tracing to all requests
      return await tracingMiddleware(request);
    }

    return NextResponse.redirect(
      new URL(`/${locale}${pathname}`, request.url)
    );
  }

  // Add locale info to headers for server components
  const response = NextResponse.next();
  response.headers.set('x-pathname', pathname);
  response.headers.set('x-locale', getLocale(request));

  // Apply tracing to all requests
  return await tracingMiddleware(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};