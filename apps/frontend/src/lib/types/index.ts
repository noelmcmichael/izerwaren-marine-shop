// Local types to replace @izerwaren/shared dependency for hotfix
export interface Product {
  id: string;
  title: string;
  description?: string;
  sku: string;
  price?: string;
  retailPrice?: string;
  availability?: string;
  vendor?: string;
  productType?: string;
  tags?: string[];
  images: MediaAsset[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  shopifyVariants: any[];
  technicalSpecs?: TechnicalSpecification[];
}

export interface MediaAsset {
  id: string;
  imageUrl?: string;
  localPath?: string;
  altText?: string;
  isPrimary: boolean;
}

export interface TechnicalSpecification {
  name: string;
  value: string;
  category?: string;
}

export interface Customer {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export interface CustomerSession {
  customerId: string;
  sessionId: string;
}

// Utility functions
export function formatPrice(price: number | string | undefined): string {
  if (!price) return '$0.00';
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(numPrice);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US');
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Product Comparison Types - Task 9.5
export interface ProductSummary {
  id: string;
  title: string;
  description?: string;
  price?: string;
  imageUrl?: string;
  vendor?: string;
  sku: string;
  availability?: string;
  technicalSpecs?: TechnicalSpecification[];
}

export interface ComparisonState {
  products: ProductSummary[];
  maxProducts: number;
  isOpen: boolean;
}

export interface ComparisonActions {
  addProduct: (product: ProductSummary) => boolean;
  removeProduct: (productId: string) => void;
  clearComparison: () => void;
  toggleComparison: () => void;
  isProductInComparison: (productId: string) => boolean;
}

// Recently Viewed Types - Task 9.5
export interface RecentlyViewedItem {
  productId: string;
  viewedAt: Date;
  title: string;
  imageUrl?: string;
  price?: string;
  sku: string;
  vendor?: string;
}

export interface RecentlyViewedState {
  items: RecentlyViewedItem[];
  maxItems: number;
}

export interface RecentlyViewedActions {
  addRecentlyViewed: (product: ProductSummary) => void;
  clearRecentlyViewed: () => void;
  getRecentlyViewed: () => RecentlyViewedItem[];
}

// Product Actions Types - Task 9.5
export interface ProductActionResult {
  success: boolean;
  message: string;
  actionType: 'cart' | 'quote' | 'comparison' | 'recentlyViewed';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
}

export interface ProductActions {
  addToCart: (product: ProductSummary, quantity?: number) => Promise<ProductActionResult>;
  requestQuote: (product: ProductSummary, quantity?: number) => Promise<ProductActionResult>;
  addToComparison: (product: ProductSummary) => ProductActionResult;
  removeFromComparison: (productId: string) => ProductActionResult;
}