import { NextRequest, NextResponse } from 'next/server';
import ShopifyBuy from 'shopify-buy';
import { config } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const category = searchParams.get('ownerCategory') || searchParams.get('category');

    // Check Shopify configuration from environment
    const domain = config.shopify.storeDomain;
    const token = config.shopify.storefrontAccessToken;

    if (!domain || !token) {
      return NextResponse.json(
        {
          error: 'Shopify not configured',
          message: 'Shopify Storefront API credentials not available',
          debug: {
            hasDomain: !!domain,
            hasToken: !!token,
          },
        },
        { status: 503 }
      );
    }

    // Initialize Shopify client directly
    const client = ShopifyBuy.buildClient({
      domain: domain,
      storefrontAccessToken: token,
    });

    // Fetch products from Shopify
    const products = await client.product.fetchAll(limit);

    // Transform Shopify products to our format
    const transformedProducts = products.map((product: ShopifyBuy.Product) => ({
      id: product.id,
      title: product.title,
      description: product.description,
      sku: product.variants?.[0]?.sku || product.id,
      price: product.variants?.[0]?.price?.amount || '0.00',
      retailPrice: product.variants?.[0]?.price?.amount || '0.00',
      categoryName: product.productType || 'Uncategorized',
      availability: product.availableForSale ? 'In Stock' : 'Out of Stock',
      imageCount: product.images?.length || 0,
      primaryImagePath: product.images?.[0]?.src,
      images:
        product.images?.map((img: ShopifyBuy.Image, index: number) => ({
          imageUrl: img.src,
          localPath: img.src,
          isPrimary: index === 0,
        })) || [],
    }));

    // Apply basic filtering
    let filteredProducts = transformedProducts;

    if (search) {
      const searchLower = search.toLowerCase();
      filteredProducts = filteredProducts.filter(
        product =>
          product.title.toLowerCase().includes(searchLower) ||
          product.description?.toLowerCase().includes(searchLower) ||
          product.sku.toLowerCase().includes(searchLower)
      );
    }

    if (category && category !== 'ALL') {
      filteredProducts = filteredProducts.filter(product =>
        product.categoryName.toLowerCase().includes(category.toLowerCase())
      );
    }

    // Apply pagination
    const total = filteredProducts.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    return NextResponse.json({
      data: paginatedProducts,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      meta: {
        source: 'shopify',
        timestamp: new Date().toISOString(),
        shopifyConfig: {
          domain: domain,
          hasToken: !!token,
        },
      },
    });
  } catch (error) {
    console.error('Shopify API error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch products',
        message: error instanceof Error ? error.message : 'Unknown error',
        meta: {
          source: 'shopify-error',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
