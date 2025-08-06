'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, X, Plus, Minus, ExternalLink } from 'lucide-react';
import { useCart } from '../../providers/CartProvider';

interface MiniCartProps {
  className?: string;
}

export const MiniCart: React.FC<MiniCartProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { cart, isLoading, error, updateCartItem, removeFromCart, getCheckoutUrl, isShopifyConfigured } = useCart();

  const handleUpdateQuantity = async (lineItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      await removeFromCart(lineItemId);
    } else {
      await updateCartItem(lineItemId, newQuantity);
    }
  };

  const handleCheckout = () => {
    const checkoutUrl = getCheckoutUrl();
    if (checkoutUrl) {
      window.open(checkoutUrl, '_blank');
    }
  };

  const totalItems = cart?.totalQuantity || 0;

  if (!isShopifyConfigured) {
    return (
      <div className={`relative ${className}`}>
        <button
          className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors"
          title="Cart (Shopify not configured)"
        >
          <ShoppingCart className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 bg-gray-400 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            0
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Cart Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-700 hover:text-gray-900 transition-colors"
        aria-label={`Shopping cart with ${totalItems} items`}
      >
        <ShoppingCart className="h-6 w-6" />
        {totalItems > 0 && (
          <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {totalItems > 99 ? '99+' : totalItems}
          </span>
        )}
      </button>

      {/* Cart Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Cart Panel */}
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Shopping Cart
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="max-h-96 overflow-y-auto">
              {isLoading && (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Loading cart...</p>
                </div>
              )}

              {error && (
                <div className="p-4 text-center">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {!isLoading && !error && (!cart || cart.items.length === 0) && (
                <div className="p-6 text-center">
                  <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">Your cart is empty</p>
                  <Link
                    href="/catalog"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Continue Shopping
                  </Link>
                </div>
              )}

              {!isLoading && !error && cart && cart.items.length > 0 && (
                <>
                  {/* Cart Items */}
                  <div className="p-4 space-y-4">
                    {cart.items.map((item) => (
                      <div key={item.variantId} className="flex items-center space-x-3">
                        {/* Product Image */}
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.productTitle}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingCart className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.productTitle}
                          </p>
                          {item.variantTitle !== 'Default Title' && (
                            <p className="text-xs text-gray-500">{item.variantTitle}</p>
                          )}
                          <p className="text-sm font-semibold text-blue-600">
                            ${parseFloat(item.price).toFixed(2)}
                          </p>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleUpdateQuantity(item.variantId, item.quantity - 1)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            disabled={isLoading}
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="text-sm font-medium w-8 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(item.variantId, item.quantity + 1)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            disabled={isLoading}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="p-4 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-base font-semibold text-gray-900">
                        Subtotal:
                      </span>
                      <span className="text-base font-semibold text-gray-900">
                        ${parseFloat(cart.subtotal).toFixed(2)}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={handleCheckout}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                        disabled={isLoading}
                      >
                        <span>Proceed to Checkout</span>
                        <ExternalLink className="h-4 w-4" />
                      </button>

                      <Link
                        href="/cart"
                        className="block w-full text-center py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        View Full Cart
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MiniCart;