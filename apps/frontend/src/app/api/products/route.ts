import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

export const dynamic = 'force-dynamic';

// Inline category mapping function to avoid import issues
function getDbCategoriesForOwnerCategory(ownerCategory: string): string[] {
  const mappings: Record<string, string[]> = {
    'MARINE LOCKS': [
      '25, 30 and 38 mm backset; Marine Grade Mortise Locks for Small Doors',
      '40 and 50 mm backset. Marine Grade Mortise Locks GSV and S&B',
      '55 mm Backset GSV Schwepper and S&B Marine Locks',
      '55 mm backset Trioving Vingcard Marine Grade Mortise Locks',
      '65 backset mm Marine Grade Mortise Locks for full Size Doors',
      'Italian Marine Locks -Razeto and Casareto',
      'Italian Marine Locks - OIcese Ricci',
    ],
    'MARINE LEVERS, ESCUTCHEONS & ROSES': [
      'GSV and S&B Lever Handles, Marine Grade Trim',
      'Izerwaren Upgrade Marine Levers, Escutcheons and Roses',
      'Special Marine Design Levers Brass',
    ],
    'KEYING SYSTEMS - SCHWEPPER AND TRIOVING LOCKS': [
      '55 mm Backset GSV Schwepper and S&B Marine Locks',
      '55 mm backset Trioving Vingcard Marine Grade Mortise Locks',
      'Oval Key Cylinder, Tumb-turns (Trioving/Vingcard)',
      'Profile Cylinder Key/ Knob (GSV - S&B LOCKS)',
      'Profile Cylinder Key/Key',
    ],
    'CABINET HARDWARE, LOCKERS AND DECK BOXES': [
      'd- Cabinet Rim Locks with Steel Parts',
      'e - Cabinet Rim Locks Marine Grade',
      'Cabinet Hinges Stainless Steel',
      'Slam Latch Stainless Steel for Cabinet Doors',
      'Refrigerator Latches',
    ],
    'MARINE GRADE HINGES': [
      'Marine Grade Invisible Hinges',
      'Stainless Steel Deck Hinges',
      'Stainless Steel Door Hinges',
      'Easy On Hinges',
    ],
    'HATCH AND DECK HARDWARE': [
      'Hatch Fasteners with Cam Operated by Triangular key',
      'Compression Latch Hatch Fastener Stainless Steel',
      'Hatch fasteners with Cam operated by Winch Handle',
      'Hatch lifts with Cam Hand Operated',
      'Deck Tie Downs 316 Stainless Steel Surface Mount',
      'Hatch Lift',
    ],
    'GLASS DOOR AND SHOWER DOOR HARDWARE': [
      'Glass Door Hinge Stainless Steel',
      'Glass Door Lock Full Size Steel Parts',
      'Glass Door Mechanism for Exterior Full Size Swinging Doors',
      'Glass Door Mechanism for Exterior Medium Size Swinging Doors',
      'Glass Clamps Wall and Tube Mounted - Stainless Steel',
    ],
    'SLIDING DOOR TRACK 316 STAINLESS STEEL': [
      'Sliding Door Mortise Locks', 
      'Pocket Door Sliding Mortise Locks'
    ],
    'CLEATS, BOLLARDS & HAWSE PIPES': [
      'Bollards', 
      'Fold Down Cleats 316 Stainless Steel'
    ],
    'DOOR HOLDERS, DOOR STOPS, WINDOW STAYS & DOOR STAY': [
      'Door Holder Clamping Model',
      'Door Holder Hook Model',
      'Push Door Holder',
      'Magnetic Door Holder Heavy Duty',
      'Magnetic Door Holder Light Duty',
      'Magnetic Light Door Holder Plastic Ivory & Brown',
      'Window Stay Stainless Steel',
      'Window Stay Brass',
      'Window Stay Telescopic Stainless Steel',
      'Door Stay Stainless Steel',
      'Door Stays Brass',
      'Dogging Devices for Doors And Hatches',
    ],
    'DOOR CLOSERS HYDRAULIC': [
      'Door Closer Stainless Steel Set', 
      'Door Closer Steel Fire Rated'
    ],
    'GASSPRINGS / GAS STRUTS': [
      'Gas Spring - End Fittings Stainless Steel',
      'Gas Spring Charging Kit',
      'Gas Springs Bleeding Kit',
      'Gas spring - Mounting Hardware',
    ],
    'FIRE FIGHTING AND HOSE DOWN EQUIPMENT': [
      'Valves, Hoses, Nozzles and Couplings'
    ],
    'PULLS / GRABRAILS / HOOKS / BRACKETS': [
      'Door Pulls, Grab Rails and Steps',
      'b - Push / Pull Mechanism',
      'a - Push Button Mechanism',
      'g - Pull to Open Latch Mechanism',
      'c - Button & Rings for Push/Pull mechanisms',
      'Ajar Hooks',
    ],
    'DECORATIVE DESIGNS FOR LEVERS, ESCUTCHEONS, ROSES': [
      'Jado Decorative Lever Designs',
      'Italian Contemporary Lever Designs',
      'Jado and Wilka Mortise Locks',
    ],
    'TUBULAR LOCK SYSTEMS': [
      'Tubular Latches and Dead Bolts'
    ],
    'FLUSH BOLTS, EDGE BOLTS': [
      'Flush Bolts',
      'f - Barrel Bolts, Stainless Steel.',
      'Barrel Bolt / Transom Door / Bulwark Door Bolts. Stainless Steel',
    ],
  };
  
  return mappings[ownerCategory] || [];
}

// Type definitions for Shopify GraphQL response
interface ShopifyProduct {
  id: string;
  title: string;
  description: string;
  productType: string;
  availableForSale: boolean;
  variants: {
    edges: Array<{
      node: {
        id: string;
        sku?: string;
        price: {
          amount: string;
        };
      };
    }>;
  };
  images: {
    edges: Array<{
      node: {
        url: string;
        altText?: string;
      };
    }>;
  };
}

interface GraphQLEdge {
  node: ShopifyProduct;
}

// GraphQL query to fetch all products with pagination
const PRODUCTS_QUERY = `
  query getProducts($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          title
          description
          productType
          availableForSale
          variants(first: 1) {
            edges {
              node {
                id
                sku
                price {
                  amount
                }
              }
            }
          }
          images(first: 10) {
            edges {
              node {
                url
                altText
              }
            }
          }
        }
      }
    }
  }
`;

async function fetchAllShopifyProducts(domain: string, token: string): Promise<ShopifyProduct[]> {
  const allProducts: ShopifyProduct[] = [];
  let hasNextPage = true;
  let cursor: string | null = null;
  const batchSize = 250; // Shopify's max per request

  while (hasNextPage) {
    try {
      const response = await fetch(`https://${domain}/api/2024-01/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': token,
        },
        body: JSON.stringify({
          query: PRODUCTS_QUERY,
          variables: {
            first: batchSize,
            after: cursor,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`GraphQL request failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
      }

      const products = data.data.products.edges.map((edge: GraphQLEdge) => edge.node);
      allProducts.push(...products);

      hasNextPage = data.data.products.pageInfo.hasNextPage;
      cursor = data.data.products.pageInfo.endCursor;

      // Safety limit to prevent infinite loops
      if (allProducts.length > 2000) {
        console.warn('Reached safety limit of 2000 products');
        break;
      }
    } catch (error) {
      console.error('Error fetching products batch:', error);
      break;
    }
  }

  // Log for debugging in development only
  if (config.environment === 'development') {
    // eslint-disable-next-line no-console
    console.log(`Fetched ${allProducts.length} total products from Shopify`);
  }
  return allProducts;
}

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

    // Use GraphQL API directly for full product access

    // Fetch ALL products from Shopify using GraphQL pagination
    const allProducts = await fetchAllShopifyProducts(domain, token);

    // Transform GraphQL products to our format
    const transformedProducts = allProducts.map((product: ShopifyProduct) => {
      const firstVariant = product.variants?.edges?.[0]?.node;
      const images = product.images?.edges?.map(edge => edge.node) || [];

      // Generate URL-safe SKU
      let urlSafeSku = firstVariant?.sku;
      if (!urlSafeSku || urlSafeSku.startsWith('gid://shopify/')) {
        // Extract numeric ID from GraphQL ID for URL-safe routing
        const gidParts = product.id.split('/');
        const numericId = gidParts[gidParts.length - 1];
        urlSafeSku = `shopify-${numericId}`;
      }

      return {
        id: product.id,
        title: product.title,
        description: product.description,
        sku: urlSafeSku,
        originalSku: firstVariant?.sku || product.id, // Keep original for reference
        price: firstVariant?.price?.amount || '0.00',
        retailPrice: firstVariant?.price?.amount || '0.00',
        categoryName: product.productType || 'Uncategorized',
        availability: product.availableForSale ? 'In Stock' : 'Out of Stock',
        imageCount: images.length,
        primaryImagePath: images[0]?.url,
        images: images.map((img, index: number) => ({
          imageUrl: img.url,
          localPath: img.url,
          isPrimary: index === 0,
        })),
      };
    });

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
      // Check if it's an owner category (from inline mapping)
      const dbCategories = getDbCategoriesForOwnerCategory(category);
      
      if (dbCategories.length > 0) {
        // Filter by mapped database categories for this owner category
        filteredProducts = filteredProducts.filter(product =>
          dbCategories.includes(product.categoryName)
        );
      } else {
        // Fallback to direct category name matching
        filteredProducts = filteredProducts.filter(product =>
          product.categoryName.toLowerCase().includes(category.toLowerCase())
        );
      }
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
