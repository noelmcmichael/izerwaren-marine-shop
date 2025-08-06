import React from 'react';
import { NextSeo } from 'next-seo';
import { useTranslations } from 'next-intl';
import { generateSEO, structuredData } from '@/lib/seo';
import { Locale } from '@/i18n/config';

interface SEOHeadProps {
  title?: string;
  description?: string;
  canonical?: string;
  noindex?: boolean;
  locale?: Locale;
  type?: 'website' | 'article' | 'product';
  images?: Array<{
    url: string;
    width?: number;
    height?: number;
    alt?: string;
  }>;
  productMetadata?: {
    brand?: string;
    category?: string;
    price?: string;
    currency?: string;
    availability?: 'in_stock' | 'out_of_stock' | 'preorder';
    sku?: string;
  };
  breadcrumbs?: Array<{
    name: string;
    url: string;
  }>;
  additionalStructuredData?: Record<string, any>;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  canonical,
  noindex = false,
  locale,
  type = 'website',
  images,
  productMetadata,
  breadcrumbs,
  additionalStructuredData,
}) => {
  const t = useTranslations('seo');

  // Generate SEO configuration
  const seoConfig = generateSEO({
    title: title || t('home.title'),
    description: description || t('home.description'),
    canonical,
    noindex,
    locale,
    type,
    images,
    productMetadata,
  });

  // Generate structured data
  const allStructuredData = [
    structuredData.organization,
    structuredData.website,
  ];

  if (breadcrumbs && breadcrumbs.length > 0) {
    allStructuredData.push(structuredData.breadcrumbs(breadcrumbs));
  }

  if (additionalStructuredData) {
    allStructuredData.push(additionalStructuredData);
  }

  return (
    <>
      <NextSeo {...seoConfig} />
      
      {/* Structured Data */}
      {allStructuredData.map((data, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(data, null, 2),
          }}
        />
      ))}
      
      {/* Additional meta tags for enhanced SEO */}
      <meta name="format-detection" content="telephone=no" />
      <meta name="theme-color" content="#1e40af" />
      <meta name="msapplication-TileColor" content="#1e40af" />
      
      {/* Preconnect to external domains for performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://cdn.shopify.com" />
      
      {/* DNS prefetch for external resources */}
      <link rel="dns-prefetch" href="//www.google-analytics.com" />
      <link rel="dns-prefetch" href="//www.googletagmanager.com" />
    </>
  );
};

interface ProductSEOProps {
  product: {
    name: string;
    description: string;
    sku: string;
    category: string;
    price?: string;
    currency?: string;
    availability?: 'in_stock' | 'out_of_stock' | 'preorder';
    images?: Array<{
      url: string;
      alt?: string;
    }>;
  };
  locale?: Locale;
  breadcrumbs?: Array<{
    name: string;
    url: string;
  }>;
}

export const ProductSEO: React.FC<ProductSEOProps> = ({
  product,
  locale,
  breadcrumbs,
}) => {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://izerwaren.com';
  const canonical = `${baseUrl}/${locale || 'en'}/product/${product.sku}`;

  const productStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    sku: product.sku,
    category: product.category,
    brand: {
      '@type': 'Brand',
      name: 'Izerwaren',
    },
    manufacturer: {
      '@type': 'Organization',
      name: 'Izerwaren',
    },
    ...(product.images && product.images.length > 0 && {
      image: product.images.map(img => img.url),
    }),
    ...(product.price && {
      offers: {
        '@type': 'Offer',
        price: product.price,
        priceCurrency: product.currency || 'USD',
        availability: `https://schema.org/${
          product.availability === 'in_stock' ? 'InStock' :
          product.availability === 'out_of_stock' ? 'OutOfStock' :
          'PreOrder'
        }`,
        seller: {
          '@type': 'Organization',
          name: 'Izerwaren',
        },
      },
    }),
  };

  return (
    <SEOHead
      title={`${product.name} - ${product.sku}`}
      description={product.description}
      canonical={canonical}
      locale={locale}
      type="product"
      images={product.images?.map(img => ({
        url: img.url,
        alt: img.alt || product.name,
      }))}
      productMetadata={{
        brand: 'Izerwaren',
        category: product.category,
        price: product.price,
        currency: product.currency || 'USD',
        availability: product.availability || 'in_stock',
        sku: product.sku,
      }}
      breadcrumbs={breadcrumbs}
      additionalStructuredData={productStructuredData}
    />
  );
};

interface CategorySEOProps {
  category: {
    name: string;
    description: string;
    slug: string;
    productCount?: number;
  };
  locale?: Locale;
  breadcrumbs?: Array<{
    name: string;
    url: string;
  }>;
}

export const CategorySEO: React.FC<CategorySEOProps> = ({
  category,
  locale,
  breadcrumbs,
}) => {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://izerwaren.com';
  const canonical = `${baseUrl}/${locale || 'en'}/catalog?category=${encodeURIComponent(category.slug)}`;

  const title = `${category.name} - Marine Hardware & Fasteners`;
  const description = category.description || 
    `Browse our ${category.name.toLowerCase()} collection. ${category.productCount ? `${category.productCount} products available.` : ''} Professional marine hardware for B2B customers.`;

  return (
    <SEOHead
      title={title}
      description={description}
      canonical={canonical}
      locale={locale}
      breadcrumbs={breadcrumbs}
    />
  );
};