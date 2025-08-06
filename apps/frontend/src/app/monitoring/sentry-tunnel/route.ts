import { NextRequest, NextResponse } from 'next/server';

// Sentry tunnel endpoint to bypass ad blockers and improve data delivery
export async function POST(request: NextRequest) {
  try {
    const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;
    
    if (!sentryDsn) {
      return NextResponse.json(
        { error: 'Sentry DSN not configured' },
        { status: 500 }
      );
    }

    // Extract Sentry project information from DSN
    const dsnUrl = new URL(sentryDsn);
    const projectId = dsnUrl.pathname.substring(1);
    const sentryHost = dsnUrl.host;

    // Forward the request to Sentry
    const sentryEndpoint = `https://${sentryHost}/api/${projectId}/envelope/`;
    
    const response = await fetch(sentryEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': request.headers.get('Content-Type') || 'application/x-sentry-envelope',
        'User-Agent': request.headers.get('User-Agent') || 'Izerwaren-Frontend',
      },
      body: await request.text(),
    });

    // Return the response from Sentry
    return new NextResponse(response.body, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
      },
    });

  } catch (error) {
    console.error('Sentry tunnel error:', error);
    
    // Return success to avoid client-side retries that could cause noise
    return NextResponse.json({ success: true }, { status: 200 });
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}