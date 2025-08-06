import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://izerwaren.com';
  
  const robotsTxt = `User-agent: *
Allow: /

# Disallow private pages
Disallow: /dashboard
Disallow: /account
Disallow: /admin
Disallow: /api
Disallow: /_next
Disallow: /monitoring

# Disallow non-canonical locale paths for crawlers
# Allow main locales but prevent duplicate content issues
Disallow: /*?*
Disallow: /*#*

# Allow important static files
Allow: /favicon.ico
Allow: /robots.txt
Allow: /sitemap.xml
Allow: /*.css
Allow: /*.js

# Sitemap location
Sitemap: ${baseUrl}/sitemap.xml

# Crawl-delay for courtesy (optional)
Crawl-delay: 1`;

  return new NextResponse(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}