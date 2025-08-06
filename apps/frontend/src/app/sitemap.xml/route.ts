import { NextResponse } from 'next/server';
import { locales, defaultLocale } from '@/i18n/config';

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  alternates?: Array<{
    hreflang: string;
    href: string;
  }>;
}

function generateSitemapXML(urls: SitemapUrl[]): string {
  const urlElements = urls.map(url => {
    const alternates = url.alternates?.map(alt => 
      `    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${alt.href}" />`
    ).join('\n') || '';

    return `  <url>
    <loc>${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
    ${url.priority ? `<priority>${url.priority}</priority>` : ''}
${alternates}
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlElements}
</urlset>`;
}

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://izerwaren.com';
  const currentDate = new Date().toISOString();

  // Static pages configuration
  const staticPages = [
    { path: '', priority: 1.0, changefreq: 'daily' as const },
    { path: 'catalog', priority: 0.9, changefreq: 'daily' as const },
    { path: 'categories', priority: 0.8, changefreq: 'weekly' as const },
    { path: 'about', priority: 0.7, changefreq: 'monthly' as const },
    { path: 'contact', priority: 0.7, changefreq: 'monthly' as const },
    { path: 'services', priority: 0.7, changefreq: 'monthly' as const },
    { path: 'shipping', priority: 0.6, changefreq: 'monthly' as const },
    { path: 'privacy', priority: 0.5, changefreq: 'yearly' as const },
    { path: 'returns', priority: 0.6, changefreq: 'monthly' as const },
  ];

  const sitemapUrls: SitemapUrl[] = [];

  // Generate URLs for static pages with all locales
  staticPages.forEach(page => {
    locales.forEach(locale => {
      const path = page.path ? `/${page.path}` : '';
      const url = `${baseUrl}/${locale}${path}`;
      
      // Generate alternate language links
      const alternates = locales.map(altLocale => ({
        hreflang: altLocale === defaultLocale ? 'x-default' : altLocale,
        href: `${baseUrl}/${altLocale}${path}`,
      }));

      sitemapUrls.push({
        loc: url,
        lastmod: currentDate,
        changefreq: page.changefreq,
        priority: page.priority,
        alternates,
      });
    });
  });

  // TODO: Add dynamic product URLs
  // This would typically fetch from your database
  try {
    // Mock product data - replace with actual database query
    const mockProducts = [
      { sku: 'ML-001', lastmod: '2024-01-15T00:00:00Z' },
      { sku: 'ML-002', lastmod: '2024-01-16T00:00:00Z' },
      { sku: 'HW-001', lastmod: '2024-01-17T00:00:00Z' },
    ];

    mockProducts.forEach(product => {
      locales.forEach(locale => {
        const url = `${baseUrl}/${locale}/product/${product.sku}`;
        
        const alternates = locales.map(altLocale => ({
          hreflang: altLocale === defaultLocale ? 'x-default' : altLocale,
          href: `${baseUrl}/${altLocale}/product/${product.sku}`,
        }));

        sitemapUrls.push({
          loc: url,
          lastmod: product.lastmod,
          changefreq: 'weekly',
          priority: 0.8,
          alternates,
        });
      });
    });
  } catch (error) {
    console.error('Error fetching products for sitemap:', error);
  }

  // TODO: Add category URLs
  try {
    // Mock category data - replace with actual database query
    const mockCategories = [
      { slug: 'marine-locks', lastmod: '2024-01-15T00:00:00Z' },
      { slug: 'fasteners', lastmod: '2024-01-16T00:00:00Z' },
      { slug: 'hardware', lastmod: '2024-01-17T00:00:00Z' },
    ];

    mockCategories.forEach(category => {
      locales.forEach(locale => {
        const url = `${baseUrl}/${locale}/catalog?category=${encodeURIComponent(category.slug)}`;
        
        const alternates = locales.map(altLocale => ({
          hreflang: altLocale === defaultLocale ? 'x-default' : altLocale,
          href: `${baseUrl}/${altLocale}/catalog?category=${encodeURIComponent(category.slug)}`,
        }));

        sitemapUrls.push({
          loc: url,
          lastmod: category.lastmod,
          changefreq: 'weekly',
          priority: 0.7,
          alternates,
        });
      });
    });
  } catch (error) {
    console.error('Error fetching categories for sitemap:', error);
  }

  const sitemapXML = generateSitemapXML(sitemapUrls);

  return new NextResponse(sitemapXML, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}