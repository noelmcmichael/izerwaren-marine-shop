/**
 * Mock Product Data Service
 *
 * Provides fallback product data when the backend API is not available
 * Used for production deployments where backend is not yet deployed
 */

interface MockProduct {
  id: string;
  title: string;
  description?: string;
  sku: string;
  price: string;
  retailPrice: string;
  categoryName: string;
  availability: string;
  imageCount: number;
  primaryImagePath?: string;
  images?: Array<{
    imageUrl?: string;
    localPath?: string;
    isPrimary: boolean;
  }>;
}

interface MockProductsResponse {
  data: MockProduct[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

const MOCK_PRODUCTS: MockProduct[] = [
  {
    id: '1',
    title: 'Marine Grade Mortise Lock',
    description:
      'High-quality stainless steel mortise lock for marine applications. Corrosion resistant and built to withstand harsh marine environments.',
    sku: 'GSV-ML-55',
    price: '189.99',
    retailPrice: '219.99',
    categoryName: 'MARINE LOCKS',
    availability: 'In Stock',
    imageCount: 3,
    primaryImagePath: '/images/products/marine-locks/gsv-ml-55-primary.jpg',
    images: [
      {
        imageUrl: '/images/products/marine-locks/gsv-ml-55-primary.jpg',
        isPrimary: true,
      },
    ],
  },
  {
    id: '2',
    title: 'Stainless Steel Deck Hinge',
    description:
      'Heavy-duty deck hinge with corrosion resistance. Perfect for hatches, doors, and deck access panels.',
    sku: 'IZW-DH-316',
    price: '45.99',
    retailPrice: '52.99',
    categoryName: 'HINGES',
    availability: 'In Stock',
    imageCount: 2,
    primaryImagePath: '/images/products/hinges/izw-dh-316-primary.jpg',
    images: [
      {
        imageUrl: '/images/products/hinges/izw-dh-316-primary.jpg',
        isPrimary: true,
      },
    ],
  },
  {
    id: '3',
    title: 'Waterproof Hatch Fastener',
    description:
      'Premium waterproof hatch fastener with cam operation. Ensures watertight seal for critical applications.',
    sku: 'MP-HF-WP',
    price: '78.50',
    retailPrice: '89.99',
    categoryName: 'HATCH HARDWARE',
    availability: 'In Stock',
    imageCount: 4,
    primaryImagePath: '/images/products/hatch-hardware/mp-hf-wp-primary.jpg',
    images: [
      {
        imageUrl: '/images/products/hatch-hardware/mp-hf-wp-primary.jpg',
        isPrimary: true,
      },
    ],
  },
  {
    id: '4',
    title: 'Marine Grade Bolt Set',
    description:
      'A2-316 stainless steel bolt set for marine applications. Includes bolts, nuts, and washers.',
    sku: 'IZW-BOLT-A2-316',
    price: '24.99',
    retailPrice: '29.99',
    categoryName: 'FASTENERS',
    availability: 'In Stock',
    imageCount: 1,
    primaryImagePath: '/images/products/fasteners/bolt-set-primary.jpg',
    images: [
      {
        imageUrl: '/images/products/fasteners/bolt-set-primary.jpg',
        isPrimary: true,
      },
    ],
  },
  {
    id: '5',
    title: 'Clevis Pin with Lanyard',
    description:
      'Marine grade clevis pin with safety lanyard. Prevents loss and provides secure attachment.',
    sku: 'MG-CP-LAN',
    price: '12.75',
    retailPrice: '15.99',
    categoryName: 'FASTENERS',
    availability: 'In Stock',
    imageCount: 2,
    primaryImagePath: '/images/products/fasteners/clevis-pin-primary.jpg',
    images: [
      {
        imageUrl: '/images/products/fasteners/clevis-pin-primary.jpg',
        isPrimary: true,
      },
    ],
  },
  {
    id: '6',
    title: 'Heavy Duty Shackle',
    description: 'Forged stainless steel shackle for heavy lifting and rigging applications.',
    sku: 'HD-SHACKLE-10',
    price: '89.99',
    retailPrice: '105.99',
    categoryName: 'HARDWARE',
    availability: 'In Stock',
    imageCount: 3,
    primaryImagePath: '/images/products/hardware/shackle-primary.jpg',
    images: [
      {
        imageUrl: '/images/products/hardware/shackle-primary.jpg',
        isPrimary: true,
      },
    ],
  },
  {
    id: '7',
    title: 'Marine Electrical Connector',
    description: 'Waterproof electrical connector rated for marine environments. IP67 protection.',
    sku: 'MEC-IP67-4P',
    price: '34.50',
    retailPrice: '39.99',
    categoryName: 'ELECTRONICS',
    availability: 'In Stock',
    imageCount: 2,
    primaryImagePath: '/images/products/electronics/connector-primary.jpg',
    images: [
      {
        imageUrl: '/images/products/electronics/connector-primary.jpg',
        isPrimary: true,
      },
    ],
  },
  {
    id: '8',
    title: 'Anchor Chain Link',
    description: 'High-strength galvanized anchor chain link. Tested for marine anchoring systems.',
    sku: 'ACL-G-8MM',
    price: '8.25',
    retailPrice: '10.99',
    categoryName: 'ANCHORING',
    availability: 'In Stock',
    imageCount: 1,
    primaryImagePath: '/images/products/anchoring/chain-link-primary.jpg',
    images: [
      {
        imageUrl: '/images/products/anchoring/chain-link-primary.jpg',
        isPrimary: true,
      },
    ],
  },
  {
    id: '9',
    title: 'Emergency Signal Flare',
    description:
      'Coast Guard approved emergency signal flare. Essential safety equipment for marine vessels.',
    sku: 'ESF-CG-12H',
    price: '15.99',
    retailPrice: '19.99',
    categoryName: 'SAFETY',
    availability: 'In Stock',
    imageCount: 2,
    primaryImagePath: '/images/products/safety/flare-primary.jpg',
    images: [
      {
        imageUrl: '/images/products/safety/flare-primary.jpg',
        isPrimary: true,
      },
    ],
  },
  {
    id: '10',
    title: 'Life Ring with Rope',
    description:
      'USCG approved life ring with 50ft of rope. Essential safety equipment for docks and vessels.',
    sku: 'LR-USCG-50',
    price: '45.00',
    retailPrice: '55.99',
    categoryName: 'SAFETY',
    availability: 'In Stock',
    imageCount: 3,
    primaryImagePath: '/images/products/safety/life-ring-primary.jpg',
    images: [
      {
        imageUrl: '/images/products/safety/life-ring-primary.jpg',
        isPrimary: true,
      },
    ],
  },
];

// Generate additional products to reach 947 total
const ADDITIONAL_CATEGORIES = [
  'MARINE LOCKS',
  'FASTENERS',
  'HARDWARE',
  'HINGES',
  'HATCH HARDWARE',
  'ELECTRONICS',
  'ANCHORING',
  'SAFETY',
  'DECK FITTINGS',
  'CLEATS',
  'PULLEYS',
  'WINCHES',
  'ROPE',
  'CHAINS',
  'BUOYS',
  'LIGHTS',
  'PUMPS',
  'VALVES',
  'GAUGES',
  'SWITCHES',
];

// Generate expanded product list
function generateMockProducts(): MockProduct[] {
  const products = [...MOCK_PRODUCTS];

  for (let i = 11; i <= 947; i++) {
    const categoryIndex = i % ADDITIONAL_CATEGORIES.length;
    const category = ADDITIONAL_CATEGORIES[categoryIndex];

    products.push({
      id: i.toString(),
      title: `Marine ${category.toLowerCase().replace(/_/g, ' ')} Product ${i}`,
      description: `High-quality marine grade ${category.toLowerCase().replace(/_/g, ' ')} for professional applications.`,
      sku: `IZW-${String(i).padStart(4, '0')}`,
      price: (Math.random() * 200 + 10).toFixed(2),
      retailPrice: (parseFloat((Math.random() * 200 + 10).toFixed(2)) * 1.2).toFixed(2),
      categoryName: category,
      availability: Math.random() > 0.1 ? 'In Stock' : 'Limited Stock',
      imageCount: Math.floor(Math.random() * 4) + 1,
      primaryImagePath: `/images/products/placeholder-${categoryIndex % 5}.jpg`,
      images: [
        {
          imageUrl: `/images/products/placeholder-${categoryIndex % 5}.jpg`,
          isPrimary: true,
        },
      ],
    });
  }

  return products;
}

const ALL_MOCK_PRODUCTS = generateMockProducts();

export class MockProductService {
  /**
   * Get products with pagination and filtering
   */
  static async getProducts(
    page = 1,
    limit = 20,
    category?: string,
    search?: string,
    subcategories?: string
  ): Promise<MockProductsResponse> {
    let filteredProducts = ALL_MOCK_PRODUCTS;

    // Apply category filter
    if (category && category !== 'ALL') {
      filteredProducts = filteredProducts.filter(
        product => product.categoryName === category.toUpperCase()
      );
    }

    // Apply subcategory filter
    if (subcategories) {
      const subCategoryList = subcategories.split(',').map(s => s.trim().toUpperCase());
      filteredProducts = filteredProducts.filter(product =>
        subCategoryList.includes(product.categoryName)
      );
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredProducts = filteredProducts.filter(
        product =>
          product.title.toLowerCase().includes(searchLower) ||
          product.description?.toLowerCase().includes(searchLower) ||
          product.sku.toLowerCase().includes(searchLower) ||
          product.categoryName.toLowerCase().includes(searchLower)
      );
    }

    // Calculate pagination
    const total = filteredProducts.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      data: paginatedProducts,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Get products by specific category with special handling
   */
  static async getProductsByCategory(
    category: string,
    page = 1,
    limit = 20
  ): Promise<MockProductsResponse> {
    if (category === 'VARIANT_PRODUCTS') {
      // Return products that have variants (for demo purposes, return first 50)
      const variantProducts = ALL_MOCK_PRODUCTS.slice(0, 50);
      return this.paginateProducts(variantProducts, page, limit);
    }

    if (category === 'PDF_PRODUCTS') {
      // Return products that have PDFs (for demo purposes, return products with even IDs)
      const pdfProducts = ALL_MOCK_PRODUCTS.filter(p => parseInt(p.id) % 2 === 0);
      return this.paginateProducts(pdfProducts, page, limit);
    }

    return this.getProducts(page, limit, category);
  }

  /**
   * Get featured products
   */
  static async getFeaturedProducts(categories: string[]): Promise<MockProduct[]> {
    const featured: MockProduct[] = [];

    for (const category of categories) {
      const categoryProducts = ALL_MOCK_PRODUCTS.filter(
        p => p.categoryName === category.toUpperCase()
      );

      if (categoryProducts.length > 0) {
        // Get first product from each category as featured
        featured.push(categoryProducts[0]);
      }
    }

    // If we don't have enough featured products, fill with top products
    while (featured.length < categories.length && featured.length < 10) {
      const randomProduct = ALL_MOCK_PRODUCTS[Math.floor(Math.random() * ALL_MOCK_PRODUCTS.length)];
      if (!featured.find(p => p.id === randomProduct.id)) {
        featured.push(randomProduct);
      }
    }

    await new Promise(resolve => setTimeout(resolve, 50));
    return featured.slice(0, categories.length);
  }

  /**
   * Get product by SKU
   */
  static async getProductBySku(sku: string): Promise<MockProduct | null> {
    const product = ALL_MOCK_PRODUCTS.find(p => p.sku === sku);

    await new Promise(resolve => setTimeout(resolve, 50));
    return product || null;
  }

  /**
   * Check if API is available
   */
  static async isApiAvailable(apiUrl: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

      const response = await fetch(`${apiUrl}/status`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }

  private static paginateProducts(
    products: MockProduct[],
    page: number,
    limit: number
  ): MockProductsResponse {
    const total = products.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = products.slice(startIndex, endIndex);

    return {
      data: paginatedProducts,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }
}

export default MockProductService;
