// Cart-related types for B2B bulk ordering backend
export interface CartItem {
  id: string;
  shopify_product_id: string;
  shopify_variant_id: string;
  sku: string;
  title: string;
  variant_title?: string;
  image_url?: string;
  quantity: number;
  unit_price: number;
  list_price: number;
  discount_percent: number;
  total_price: number;
  minimum_quantity?: number;
  quantity_increments?: number;
  in_stock: boolean;
  stock_quantity?: number;
}

export interface VolumeDiscount {
  min_quantity: number;
  discount_percent: number;
  applies_to?: 'item' | 'cart';
}

export interface CartSummary {
  items: CartItem[];
  item_count: number;
  total_quantity: number;
  subtotal: number;
  total_discount: number;
  estimated_tax?: number;
  estimated_shipping?: number;
  total_estimated: number;
  tier_discount_percent: number;
  volume_discounts_applied: VolumeDiscount[];
  savings_from_list_price: number;
}

export interface SavedCart {
  id: string;
  name: string;
  item_count: number;
  total_value: number;
  created_at: string;
  updated_at: string;
}

export interface ValidationResult {
  item_id: string;
  type: 'minimum_quantity' | 'stock' | 'discontinued' | 'tier_restriction';
  message: string;
  severity: 'error' | 'warning' | 'info';
  suggested_action?: string;
}

export interface BulkUploadResult {
  successful: number;
  failed: number;
  errors: {
    row: number;
    sku: string;
    message: string;
  }[];
  warnings: {
    row: number;
    sku: string;
    message: string;
  }[];
}