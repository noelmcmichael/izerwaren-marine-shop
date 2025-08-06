import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { NextSeo } from 'next-seo';

interface CatalogSEOProps {
  products?: Array<{
    id: string;
    title: string;
    description?: string;
    sku: string;
    price?: string;
    categoryName?: string;
    images?: Array<{
      url: string;
      altText?: string;
    }>;
  }>;
  category?: string | null;
  totalProducts?: number;
}

export function CatalogSEO({ products = [], category, totalProducts = 0 }: CatalogSEOProps) {
  const t = useTranslations('seo.catalog');
  const searchParams = useSearchParams();
  const currentCategory = category || searchParams.get('category');

  // Generate dynamic title and description based on category
  const getTitle = () => {
    if (currentCategory) {
      return `${currentCategory} - ${t('title')}`;
    }
    return t('title');
  };

  const getDescription = () => {
    if (currentCategory) {
      return `Browse our complete selection of ${currentCategory.toLowerCase()} products. ${t('description')}`;
    }
    return t('description');
  };

  // Generate structured data for product catalog
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: getTitle(),
    description: getDescription(),
    url: typeof window !== 'undefined' ? window.location.href : '',
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          item: {
            '@type': 'WebPage',
            '@id': typeof window !== 'undefined' ? new URL('/', window.location.origin).href : '',
            name: 'Home'
          }
        },
        {
          '@type': 'ListItem',
          position: 2,
          item: {
            '@type': 'WebPage',
            '@id': typeof window !== 'undefined' ? window.location.href : '',
            name: currentCategory || 'Catalog'
          }
        }
      ]
    },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: totalProducts,
      itemListElement: products.slice(0, 10).map((product, index) => ({
        '@type': 'Product',
        '@id': typeof window !== 'undefined' ? new URL(`/product/${product.sku}`, window.location.origin).href : '',
        position: index + 1,
        name: product.title,
        description: product.description,
        sku: product.sku,
        category: product.categoryName,
        offers: {
          '@type': 'Offer',
          price: product.price ? parseFloat(product.price.replace(/[^0-9.]/g, '')) : undefined,
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock'
        },
        image: product.images?.[0]?.url
      }))
    },
    provider: {
      '@type': 'Organization',
      name: 'Izerwaren',
      description: 'Marine hardware and industrial supplies for business customers',
      url: typeof window !== 'undefined' ? new URL('/', window.location.origin).href : ''
    }
  };

  return (
    <>
      <NextSeo
        title={getTitle()}
        description={getDescription()}
        openGraph={{
          type: 'website',
          title: getTitle(),
          description: getDescription(),
          siteName: 'Izerwaren',
          images: products.length > 0 && products[0].images?.length ? [{
            url: products[0].images[0].url,
            alt: products[0].images[0].altText || products[0].title,
            width: 1200,
            height: 630
          }] : []
        }}
        twitter={{
          cardType: 'summary_large_image',
          site: '@izerwaren'
        }}
      />
      
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData, null, 2),
        }}
      />
    </>
  );
}