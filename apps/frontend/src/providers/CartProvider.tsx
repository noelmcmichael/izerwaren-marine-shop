'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { shopifyService, Cart, AddToCartOptions } from '../services/shopify';
import { cartAnalytics } from '../services/cartAnalytics';

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;
  isShopifyConfigured: boolean;
}

type CartAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CART'; payload: Cart | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SHOPIFY_CONFIGURED'; payload: boolean };

const initialState: CartState = {
  cart: null,
  isLoading: false,
  error: null,
  isShopifyConfigured: false,
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_CART':
      return { ...state, cart: action.payload, error: null };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'SET_SHOPIFY_CONFIGURED':
      return { ...state, isShopifyConfigured: action.payload };
    default:
      return state;
  }
}

interface CartContextType extends CartState {
  addToCart: (variantId: string, quantity?: number, options?: AddToCartOptions) => Promise<void>;
  addToCartBySku: (sku: string, quantity?: number, options?: AddToCartOptions) => Promise<void>;
  updateCartItem: (lineItemId: string, quantity: number) => Promise<void>;
  removeFromCart: (lineItemId: string) => Promise<void>;
  clearCart: () => void;
  getCheckoutUrl: () => string | null;
  refreshCart: () => Promise<void>;
  recoverCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    try {
      // Check if Shopify is configured
      const config = shopifyService.getConfiguration();
      dispatch({ type: 'SET_SHOPIFY_CONFIGURED', payload: config.isConfigured });

      // Load existing cart only if configured
      if (config.isConfigured) {
        recoverCart();
      }
    } catch (error) {
      console.warn('Shopify configuration check failed:', error);
      dispatch({ type: 'SET_SHOPIFY_CONFIGURED', payload: false });
    }
  }, []);

  const refreshCart = async () => {
    // Skip during SSR/build
    if (typeof window === 'undefined') return;
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const cart = await shopifyService.getCart();
      dispatch({ type: 'SET_CART', payload: cart });
      
      // Track cart view
      if (cart) {
        cartAnalytics.trackCartView(cart.totalQuantity, parseFloat(cart.subtotal));
      }
    } catch (error) {
      console.warn('Cart refresh failed:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to load cart' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const addToCart = async (variantId: string, quantity = 1, options: AddToCartOptions = {}) => {
    if (typeof window === 'undefined') return;
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const cart = await shopifyService.addToCart(variantId, quantity, {
        validateInventory: true,
        ...options,
      });
      dispatch({ type: 'SET_CART', payload: cart });
      
      // Track analytics
      const item = cart.items.find(item => item.variantId === variantId);
      if (item) {
        cartAnalytics.trackItemAdd(
          item.sku,
          quantity,
          parseFloat(item.price),
          parseFloat(cart.subtotal)
        );
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to add to cart' });
      // Re-throw to allow components to handle specific errors
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const addToCartBySku = async (sku: string, quantity = 1, options: AddToCartOptions = {}) => {
    if (typeof window === 'undefined') return;
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const cart = await shopifyService.addToCartBySku(sku, quantity, {
        validateInventory: true,
        ...options,
      });
      dispatch({ type: 'SET_CART', payload: cart });
      
      // Track analytics
      cartAnalytics.trackItemAdd(
        sku,
        quantity,
        cart.items.find(item => item.sku === sku)?.price ? parseFloat(cart.items.find(item => item.sku === sku)!.price) : 0,
        parseFloat(cart.subtotal)
      );
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to add to cart' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const recoverCart = async () => {
    if (typeof window === 'undefined') return;
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const cart = await shopifyService.recoverCart();
      dispatch({ type: 'SET_CART', payload: cart });
    } catch (error) {
      console.warn('Cart recovery failed:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to recover cart' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateCartItem = async (lineItemId: string, quantity: number) => {
    if (typeof window === 'undefined') return;
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const cart = await shopifyService.updateCartItem(lineItemId, quantity);
      dispatch({ type: 'SET_CART', payload: cart });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to update cart' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const removeFromCart = async (lineItemId: string) => {
    if (typeof window === 'undefined') return;
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const cart = await shopifyService.removeFromCart(lineItemId);
      dispatch({ type: 'SET_CART', payload: cart });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to remove from cart' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const clearCart = () => {
    if (typeof window === 'undefined') return;
    
    shopifyService.clearCart();
    dispatch({ type: 'SET_CART', payload: null });
  };

  const getCheckoutUrl = () => {
    if (typeof window === 'undefined') return null;
    
    const checkoutUrl = shopifyService.getCheckoutUrl();
    
    // Track checkout start
    if (checkoutUrl && state.cart) {
      cartAnalytics.trackCheckoutStart(
        state.cart.id,
        state.cart.totalQuantity,
        parseFloat(state.cart.subtotal)
      );
    }
    
    return checkoutUrl;
  };

  const value: CartContextType = {
    ...state,
    addToCart,
    addToCartBySku,
    updateCartItem,
    removeFromCart,
    clearCart,
    getCheckoutUrl,
    refreshCart,
    recoverCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export default CartProvider;