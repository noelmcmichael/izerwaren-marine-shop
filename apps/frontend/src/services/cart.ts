// B2B Cart Service with React Query integration
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { 
  CartSummary, 
  SavedCart, 
  ValidationResult, 
  BulkUploadResult
} from '../types/cart';
import { useCustomerAuth } from '../providers/CustomerAuthProvider';
import { config } from '@/lib/config';

const CART_STORAGE_KEY = 'izerwaren_b2b_cart';

const CART_API_BASE = config.api.baseUrl === '/api' ? '/api/v1/customers/cart' : `${config.api.baseUrl}/v1/customers/cart`;

// Cart API functions
export const cartApi = {
  // Get current cart with pricing applied
  async getCart(): Promise<CartSummary> {
    const response = await fetch(`${CART_API_BASE}`);
    if (!response.ok) {
      throw new Error('Failed to fetch cart');
    }
    return response.json();
  },

  // Add single item to cart
  async addItem(productId: string, variantId: string, quantity: number): Promise<CartSummary> {
    const response = await fetch(`${CART_API_BASE}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, variantId, quantity }),
    });
    if (!response.ok) {
      throw new Error('Failed to add item to cart');
    }
    return response.json();
  },

  // Update item quantity
  async updateQuantity(itemId: string, quantity: number): Promise<CartSummary> {
    const response = await fetch(`${CART_API_BASE}/items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity }),
    });
    if (!response.ok) {
      throw new Error('Failed to update quantity');
    }
    return response.json();
  },

  // Remove item from cart
  async removeItem(itemId: string): Promise<CartSummary> {
    const response = await fetch(`${CART_API_BASE}/items/${itemId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to remove item');
    }
    return response.json();
  },

  // Clear entire cart
  async clearCart(): Promise<CartSummary> {
    const response = await fetch(`${CART_API_BASE}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to clear cart');
    }
    return response.json();
  },

  // Bulk operations
  async addMultipleItems(items: { productId: string; variantId: string; quantity: number }[]): Promise<CartSummary> {
    const response = await fetch(`${CART_API_BASE}/bulk/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    if (!response.ok) {
      throw new Error('Failed to add multiple items');
    }
    return response.json();
  },

  async updateMultipleQuantities(updates: { itemId: string; quantity: number }[]): Promise<CartSummary> {
    const response = await fetch(`${CART_API_BASE}/bulk/update`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates }),
    });
    if (!response.ok) {
      throw new Error('Failed to update multiple quantities');
    }
    return response.json();
  },

  // Cart persistence
  async saveCart(name?: string): Promise<string> {
    const response = await fetch(`${CART_API_BASE}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!response.ok) {
      throw new Error('Failed to save cart');
    }
    const result = await response.json();
    return result.cartId;
  },

  async loadCart(cartId: string): Promise<CartSummary> {
    const response = await fetch(`${CART_API_BASE}/load/${cartId}`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to load cart');
    }
    return response.json();
  },

  async getSavedCarts(): Promise<SavedCart[]> {
    const response = await fetch(`${CART_API_BASE}/saved`);
    if (!response.ok) {
      throw new Error('Failed to get saved carts');
    }
    return response.json();
  },

  // Validation
  async validateCart(): Promise<ValidationResult[]> {
    const response = await fetch(`${CART_API_BASE}/validate`);
    if (!response.ok) {
      throw new Error('Failed to validate cart');
    }
    return response.json();
  },

  // Export
  async exportCart(format: 'csv' | 'pdf'): Promise<Blob> {
    const response = await fetch(`${CART_API_BASE}/export?format=${format}`);
    if (!response.ok) {
      throw new Error('Failed to export cart');
    }
    return response.blob();
  },

  // Bulk upload from CSV/Excel
  async uploadBulkOrder(file: File): Promise<BulkUploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${CART_API_BASE}/bulk/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      throw new Error('Failed to upload bulk order');
    }
    return response.json();
  },

  // Quick reorder from order history
  async reorderFromHistory(orderId: string): Promise<CartSummary> {
    const response = await fetch(`${CART_API_BASE}/reorder/${orderId}`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to reorder from history');
    }
    return response.json();
  },
};

// React Query hooks for cart management
export function useCart() {
  const { customer } = useCustomerAuth();
  const queryClient = useQueryClient();

  const cartQuery = useQuery({
    queryKey: ['cart', customer?.profile?.id || 'test-customer'],
    queryFn: cartApi.getCart,
    enabled: true, // Enable for testing - TODO: Re-enable authentication check
    staleTime: 1000 * 60, // 1 minute
    refetchOnWindowFocus: false,
  });

  const addItemMutation = useMutation({
    mutationFn: ({ productId, variantId, quantity }: { productId: string; variantId: string; quantity: number }) =>
      cartApi.addItem(productId, variantId, quantity),
    onSuccess: (data) => {
      queryClient.setQueryData(['cart', customer?.profile?.id || 'test-customer'], data);
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      cartApi.updateQuantity(itemId, quantity),
    onSuccess: (data) => {
      queryClient.setQueryData(['cart', customer?.profile?.id || 'test-customer'], data);
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: cartApi.removeItem,
    onSuccess: (data) => {
      queryClient.setQueryData(['cart', customer?.profile?.id || 'test-customer'], data);
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: cartApi.clearCart,
    onSuccess: (data) => {
      queryClient.setQueryData(['cart', customer?.profile?.id || 'test-customer'], data);
    },
  });

  const addMultipleItemsMutation = useMutation({
    mutationFn: cartApi.addMultipleItems,
    onSuccess: (data) => {
      queryClient.setQueryData(['cart', customer?.profile?.id || 'test-customer'], data);
    },
  });

  const loadCartMutation = useMutation({
    mutationFn: cartApi.loadCart,
    onSuccess: (data) => {
      queryClient.setQueryData(['cart', customer?.profile?.id || 'test-customer'], data);
    },
  });

  return {
    // Data
    cart: cartQuery.data || createEmptyCart(),
    loading: cartQuery.isLoading || addItemMutation.isPending || updateQuantityMutation.isPending,
    error: cartQuery.error || addItemMutation.error || updateQuantityMutation.error,

    // Actions
    addItem: addItemMutation.mutate,
    updateQuantity: updateQuantityMutation.mutate,
    removeItem: removeItemMutation.mutate,
    clearCart: clearCartMutation.mutate,
    addMultipleItems: addMultipleItemsMutation.mutate,
    loadCart: loadCartMutation.mutate,

    // Async actions
    saveCart: cartApi.saveCart,
    exportCart: cartApi.exportCart,
    uploadBulkOrder: cartApi.uploadBulkOrder,
    reorderFromHistory: cartApi.reorderFromHistory,

    // Refetch
    refetch: cartQuery.refetch,
  };
}

export function useSavedCarts() {
  const { customer } = useCustomerAuth();

  return useQuery({
    queryKey: ['saved-carts', customer?.profile?.id || 'test-customer'],
    queryFn: cartApi.getSavedCarts,
    enabled: true, // Enable for testing - TODO: Re-enable authentication check
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCartValidation() {
  const { customer } = useCustomerAuth();

  return useQuery({
    queryKey: ['cart-validation', customer?.profile?.id || 'test-customer'],
    queryFn: cartApi.validateCart,
    enabled: true, // Enable for testing - TODO: Re-enable authentication check
    staleTime: 1000 * 30, // 30 seconds
  });
}

// Utility functions
function createEmptyCart(): CartSummary {
  return {
    items: [],
    item_count: 0,
    total_quantity: 0,
    subtotal: 0,
    total_discount: 0,
    total_estimated: 0,
    tier_discount_percent: 0,
    volume_discounts_applied: [],
    savings_from_list_price: 0,
  };
}

// Local storage helpers for offline cart persistence
export const localCartStorage = {
  save(cart: CartSummary): void {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({
        ...cart,
        last_updated: new Date().toISOString(),
      }));
    } catch (error) {
      console.warn('Failed to save cart to localStorage:', error);
    }
  },

  load(): CartSummary | null {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (!stored) return null;
      
      const data = JSON.parse(stored);
      // Check if cart is not too old (24 hours)
      const lastUpdated = new Date(data.last_updated);
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      if (lastUpdated < dayAgo) {
        localStorage.removeItem(CART_STORAGE_KEY);
        return null;
      }
      
      return data;
    } catch (error) {
      console.warn('Failed to load cart from localStorage:', error);
      return null;
    }
  },

  clear(): void {
    localStorage.removeItem(CART_STORAGE_KEY);
  },
};