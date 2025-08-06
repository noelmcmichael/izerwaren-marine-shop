// Cart-related types for Pro Account bulk ordering
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import type { DealerTier } from '../providers/CustomerAuthProvider';

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

export interface CartContext {
  cart: CartSummary;
  loading: boolean;
  error: string | null;
  
  // Cart operations
  addItem: (productId: string, variantId: string, quantity: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  
  // Bulk operations
  addMultipleItems: (items: { productId: string; variantId: string; quantity: number }[]) => Promise<void>;
  updateMultipleQuantities: (updates: { itemId: string; quantity: number }[]) => Promise<void>;
  
  // Cart persistence
  saveCart: (name?: string) => Promise<string>; // Returns saved cart ID
  loadCart: (cartId: string) => Promise<void>;
  getSavedCarts: () => Promise<SavedCart[]>;
  
  // Export/Share
  exportCart: (format: 'csv' | 'pdf') => Promise<Blob>;
  getShareableCart: () => Promise<string>; // Returns shareable URL
  
  // Validation
  validateMinimumQuantities: () => ValidationResult[];
  validateStock: () => Promise<ValidationResult[]>;
  
  // Quick actions
  reorderFromHistory: (orderId: string) => Promise<void>;
  applyTemplate: (templateId: string) => Promise<void>;
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

export interface QuickOrderTemplate {
  id: string;
  name: string;
  description?: string;
  items: {
    sku: string;
    default_quantity: number;
  }[];
  tier_restrictions?: DealerTier[];
  created_at: string;
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

// Cart preferences for Pro Account customers
export interface CartPreferences {
  auto_save_frequency: number; // minutes
  show_list_prices: boolean;
  show_savings_calculator: boolean;
  default_quantity_increment: number;
  preferred_currency: 'USD' | 'CAD';
  email_cart_reminders: boolean;
  bulk_discount_notifications: boolean;
}