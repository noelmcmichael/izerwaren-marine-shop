import { NextSeoProps, DefaultSeoProps } from 'next-seo';
import { Locale, defaultLocale } from '../i18n/config';

export const defaultSEO: DefaultSeoProps = {
  titleTemplate: '%s | Izerwaren',
  defaultTitle: 'Izerwaren - Marine Hardware & Industrial Supplies',
  description: 'Marine grade hardware and fittings for yachts, ships, and ocean residences. Professional marine hardware, fasteners, and industrial supplies for business customers and individual buyers.',
  canonical: 'https://izerwaren.com',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://izerwaren.com',
    siteName: 'Izerwaren',
    title: 'Izerwaren - Marine Hardware & Industrial Supplies',
    description: 'Marine grade hardware and fittings for yachts, ships, and ocean residences. Professional marine hardware, fasteners, and industrial supplies for business customers.',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Izerwaren Marine Hardware',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    handle: '@izerwaren',
    site: '@izerwaren',
    cardType: 'summary_large_image',
  },
  additionalMetaTags: [
    {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1',
    },
    {
      name: 'robots',
      content: 'index,follow',
    },
    {
      name: 'author',
      content: 'Izerwaren',
    },
    {
      httpEquiv: 'x-ua-compatible',
      content: 'IE=edge',
    },
  ],
  additionalLinkTags: [
    {
      rel: 'icon',
      href: '/favicon.ico',
    },
    {
      rel: 'apple-touch-icon',
      href: '/images/apple-touch-icon.png',
      sizes: '180x180',
    },
    {
      rel: 'manifest',
      href: '/manifest.json',
    },
  ],
};

interface SEOConfigOptions {
  title?: string;
  description?: string;
  canonical?: string;
  noindex?: boolean;
  locale?: Locale;
  images?: Array<{
    url: string;
    width?: number;
    height?: number;
    alt?: string;
  }>;
  type?: 'website' | 'article' | 'product';
  publishedTime?: string;
  modifiedTime?: string;
  productMetadata?: {
    brand?: string;
    category?: string;
    price?: string;
    currency?: string;
    availability?: 'in_stock' | 'out_of_stock' | 'preorder';
    sku?: string;
  };
}

export function generateSEO(options: SEOConfigOptions = {}): NextSeoProps {
  const {
    title,
    description,
    canonical,
    noindex = false,
    locale = defaultLocale,
    images,
    type = 'website',
    publishedTime,
    modifiedTime,
    productMetadata,
  } = options;

  const seoConfig: NextSeoProps = {
    title,
    description,
    canonical,
    noindex,
    openGraph: {
      type,
      locale: locale === 'en' ? 'en_US' : `${locale}_${locale.toUpperCase()}`,
      url: canonical,
      title,
      description,
      images: images?.map(img => ({
        url: img.url,
        width: img.width || 1200,
        height: img.height || 630,
        alt: img.alt || title || defaultSEO.defaultTitle,
      })),
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
    },
    additionalMetaTags: [],
  };

  // Add product-specific metadata
  if (type === 'product' && productMetadata) {
    seoConfig.additionalMetaTags = [
      ...(seoConfig.additionalMetaTags || []),
      {
        property: 'product:brand',
        content: productMetadata.brand || 'Izerwaren',
      },
      {
        property: 'product:category',
        content: productMetadata.category || 'Marine Hardware',
      },
      {
        property: 'product:price:amount',
        content: productMetadata.price || '',
      },
      {
        property: 'product:price:currency',
        content: productMetadata.currency || 'USD',
      },
      {
        property: 'product:availability',
        content: productMetadata.availability || 'in_stock',
      },
    ];

    if (productMetadata.sku) {
      seoConfig.additionalMetaTags.push({
        property: 'product:retailer_item_id',
        content: productMetadata.sku,
      });
    }
  }

  return seoConfig;
}

export const pageSEO = {
  home: (locale: Locale = defaultLocale) => generateSEO({
    title: locale === 'es' 
      ? 'Izerwaren - Herrajes Marinos y Suministros Industriales'
      : 'Marine Hardware & Industrial Supplies',
    description: locale === 'es'
      ? 'Herrajes y accesorios de grado marino para yates, barcos y residencias oceánicas. Hardware marino profesional, sujetadores y suministros industriales.'
      : 'Marine grade hardware and fittings for yachts, ships, and ocean residences. Professional marine hardware, fasteners, and industrial supplies for business customers.',
    canonical: 'https://izerwaren.com',
    locale,
  }),

  catalog: (locale: Locale = defaultLocale) => generateSEO({
    title: locale === 'es'
      ? 'Catálogo de Productos - Herrajes Marinos'
      : 'Product Catalog - Marine Hardware',
    description: locale === 'es'
      ? 'Explore nuestro catálogo completo de herrajes marinos, sujetadores, cerraduras y suministros industriales.'
      : 'Browse our complete catalog of marine hardware, fasteners, locks, and industrial supplies.',
    canonical: 'https://izerwaren.com/catalog',
    locale,
  }),

  dashboard: (locale: Locale = defaultLocale) => generateSEO({
    title: locale === 'es'
      ? 'Panel de Cliente'
      : 'Customer Dashboard',
    description: locale === 'es'
      ? 'Gestione su cuenta, vea pedidos y acceda a precios exclusivos B2B.'
      : 'Manage your account, view orders, and access exclusive B2B pricing.',
    canonical: 'https://izerwaren.com/dashboard',
    noindex: true, // Private page
    locale,
  }),

  cart: (locale: Locale = defaultLocale) => generateSEO({
    title: locale === 'es'
      ? 'Carrito de Compras'
      : 'Shopping Cart',
    description: locale === 'es'
      ? 'Revise sus herrajes marinos y suministros industriales seleccionados.'
      : 'Review your selected marine hardware and industrial supplies.',
    canonical: 'https://izerwaren.com/cart',
    noindex: true, // Dynamic content
    locale,
  }),

  product: (productName: string, sku: string, category: string, locale: Locale = defaultLocale) => 
    generateSEO({
      title: `${productName} - ${sku}`,
      description: `${productName} - Professional marine hardware from Izerwaren. Category: ${category}. SKU: ${sku}`,
      type: 'product',
      canonical: `https://izerwaren.com/product/${sku}`,
      locale,
      productMetadata: {
        brand: 'Izerwaren',
        category,
        sku,
        availability: 'in_stock',
        currency: 'USD',
      },
    }),
};

export const structuredData = {
  organization: {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Izerwaren',
    url: 'https://izerwaren.com',
    logo: 'https://izerwaren.com/images/logo.png',
    description: 'Marine grade hardware and fittings for yachts, ships, and ocean residences.',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'US',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+1-800-MARINE',
      contactType: 'customer service',
      availableLanguage: ['English', 'Spanish'],
    },
    sameAs: [
      'https://twitter.com/izerwaren',
      'https://linkedin.com/company/izerwaren',
    ],
  },

  website: {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Izerwaren',
    url: 'https://izerwaren.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://izerwaren.com/catalog?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  },

  breadcrumbs: (items: Array<{ name: string; url: string }>) => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }),
};