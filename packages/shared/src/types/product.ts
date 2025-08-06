export interface Product {
  id: number;
  shopify_product_id?: string;
  title: string;
  description?: string;
  price: number;
  category_name: string;
  manufacturer?: string;
  sku: string;
  status: 'active' | 'draft' | 'archived';
  created_at: Date;
  updated_at: Date;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  shopify_variant_id?: string;
  title: string;
  price: number;
  sku: string;
  inventory_quantity: number;
  variant_options: Record<string, string>;
  created_at: Date;
  updated_at: Date;
}

export interface TechnicalSpecification {
  id: number;
  product_id: number;
  specification: string;
  value: string;
  unit?: string;
  category?: string;
  created_at: Date;
}
