'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Plus, Minus, X, Download, Upload, Share2, Save, ExternalLink, AlertCircle, CheckCircle, Package } from 'lucide-react';
import { useCart } from '../../providers/CartProvider';

interface BulkAddItem {
  sku: string;
  quantity: number;
}

const CartPage: React.FC = () => {
  const {
    cart,
    isLoading,
    error,
    updateCartItem,
    removeFromCart,
    clearCart,
    getCheckoutUrl,
    isShopifyConfigured,
    addToCartBySku,
  } = useCart();

  const [bulkAddText, setBulkAddText] = useState('');
  const [bulkAddLoading, setBulkAddLoading] = useState(false);
  const [bulkAddResults, setBulkAddResults] = useState<{ success: string[], failed: string[] }>({ success: [], failed: [] });
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');

  const handleUpdateQuantity = async (lineItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      await removeFromCart(lineItemId);
    } else {
      await updateCartItem(lineItemId, newQuantity);
    }
  };

  const handleBulkAdd = async () => {
    if (!bulkAddText.trim()) return;

    setBulkAddLoading(true);
    setBulkAddResults({ success: [], failed: [] });

    // Parse bulk add text (format: SKU,quantity or SKU:quantity)
    const lines = bulkAddText.split('\n').map(line => line.trim()).filter(Boolean);
    const items: BulkAddItem[] = [];

    for (const line of lines) {
      const parts = line.split(/[,:\t]/).map(p => p.trim());
      if (parts.length >= 2) {
        const sku = parts[0];
        const quantity = parseInt(parts[1]);
        if (sku && !isNaN(quantity) && quantity > 0) {
          items.push({ sku, quantity });
        }
      } else if (parts.length === 1) {
        // Default to quantity 1
        const sku = parts[0];
        if (sku) {
          items.push({ sku, quantity: 1 });
        }
      }
    }

    const success: string[] = [];
    const failed: string[] = [];

    for (const item of items) {
      try {
        await addToCartBySku(item.sku, item.quantity);
        success.push(`${item.sku} (${item.quantity})`);
      } catch (error) {
        failed.push(`${item.sku}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    setBulkAddResults({ success, failed });
    setBulkAddLoading(false);

    if (success.length > 0) {
      setBulkAddText('');
    }
  };

  const handleExportCart = () => {
    if (!cart || cart.items.length === 0) return;

    const csvContent = [
      'SKU,Product,Variant,Quantity,Price,Total',
      ...cart.items.map(item => 
        `"${item.sku}","${item.productTitle}","${item.variantTitle}",${item.quantity},$${item.price},$${(parseFloat(item.price) * item.quantity).toFixed(2)}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cart-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Shopping Cart</h1>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <AlertCircle className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
              <p className="text-yellow-800">
                Shopping cart functionality is currently unavailable. Please contact support.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <p className="text-gray-600 mt-2">
            {totalItems} {totalItems === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>

        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading cart...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <div className="flex items-center">
              <AlertCircle className="h-6 w-6 text-red-600 mr-3" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {!isLoading && !error && (!cart || cart.items.length === 0) && (
          <div className="text-center py-12">
            <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your cart is empty</h2>
            <p className="text-gray-600 mb-8">Add some products to get started</p>
            
            <div className="space-y-4">
              <Link
                href="/catalog"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Continue Shopping
              </Link>
              
              <div className="text-center">
                <button
                  onClick={() => setShowBulkAdd(!showBulkAdd)}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Or add products in bulk
                </button>
              </div>
            </div>
          </div>
        )}

        {!isLoading && !error && cart && cart.items.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {/* Bulk Add Section */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Bulk Add Products</h3>
                  <button
                    onClick={() => setShowBulkAdd(!showBulkAdd)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    {showBulkAdd ? 'Hide' : 'Show'}
                  </button>
                </div>

                {showBulkAdd && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product List (SKU, Quantity)
                      </label>
                      <textarea
                        value={bulkAddText}
                        onChange={(e) => setBulkAddText(e.target.value)}
                        placeholder="Enter products one per line:&#10;SKU123, 5&#10;SKU456, 2&#10;SKU789"
                        className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md resize-none"
                        disabled={bulkAddLoading}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Format: SKU,Quantity (one per line). Quantity defaults to 1 if omitted.
                      </p>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={handleBulkAdd}
                        disabled={bulkAddLoading || !bulkAddText.trim()}
                        className={`flex items-center px-4 py-2 rounded-md text-sm font-medium ${
                          bulkAddLoading || !bulkAddText.trim()
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {bulkAddLoading ? (
                          <>
                            <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Add to Cart
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => setBulkAddText('')}
                        disabled={bulkAddLoading}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Clear
                      </button>
                    </div>

                    {/* Bulk Add Results */}
                    {(bulkAddResults.success.length > 0 || bulkAddResults.failed.length > 0) && (
                      <div className="space-y-2">
                        {bulkAddResults.success.length > 0 && (
                          <div className="bg-green-50 border border-green-200 rounded-md p-3">
                            <div className="flex items-center">
                              <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                              <span className="text-green-800 text-sm font-medium">
                                Successfully added {bulkAddResults.success.length} products
                              </span>
                            </div>
                            <ul className="text-xs text-green-700 mt-1 ml-6">
                              {bulkAddResults.success.map((item, index) => (
                                <li key={index}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {bulkAddResults.failed.length > 0 && (
                          <div className="bg-red-50 border border-red-200 rounded-md p-3">
                            <div className="flex items-center">
                              <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                              <span className="text-red-800 text-sm font-medium">
                                Failed to add {bulkAddResults.failed.length} products
                              </span>
                            </div>
                            <ul className="text-xs text-red-700 mt-1 ml-6">
                              {bulkAddResults.failed.map((item, index) => (
                                <li key={index}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Cart Items List */}
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Cart Items</h2>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleExportCart}
                        className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </button>
                      <button
                        onClick={clearCart}
                        className="flex items-center px-3 py-2 text-sm text-red-600 border border-red-300 rounded-md hover:bg-red-50"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Clear Cart
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {cart.items.map((item) => (
                      <div key={item.variantId} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                        {/* Product Image */}
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.productTitle}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">{item.productTitle}</h3>
                          {item.variantTitle !== 'Default Title' && (
                            <p className="text-sm text-gray-500">{item.variantTitle}</p>
                          )}
                          <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                          <p className="text-lg font-semibold text-blue-600">
                            ${parseFloat(item.price).toFixed(2)}
                          </p>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleUpdateQuantity(item.variantId, item.quantity - 1)}
                            className="p-1 text-gray-400 hover:text-gray-600 border border-gray-300 rounded"
                            disabled={isLoading}
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="text-sm font-medium w-12 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(item.variantId, item.quantity + 1)}
                            className="p-1 text-gray-400 hover:text-gray-600 border border-gray-300 rounded"
                            disabled={isLoading}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Line Total */}
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                          </p>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => removeFromCart(item.variantId)}
                          className="p-1 text-red-400 hover:text-red-600"
                          disabled={isLoading}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Order Notes */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Notes</h3>
                <textarea
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Add any special instructions or notes for this order..."
                  className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md resize-none"
                />
              </div>
            </div>

            {/* Cart Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Items ({totalItems})</span>
                    <span className="font-medium">${parseFloat(cart.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="text-sm text-gray-500">Calculated at checkout</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span className="text-sm text-gray-500">Calculated at checkout</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold">Total</span>
                      <span className="text-lg font-semibold">${parseFloat(cart.subtotal).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleCheckout}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                    disabled={isLoading || totalItems === 0}
                  >
                    <span>Proceed to Checkout</span>
                    <ExternalLink className="h-4 w-4" />
                  </button>

                  <Link
                    href="/catalog"
                    className="block w-full text-center py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Continue Shopping
                  </Link>
                </div>

                {/* Additional Actions */}
                <div className="mt-6 pt-6 border-t space-y-2">
                  <button className="w-full flex items-center justify-center px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
                    <Save className="h-4 w-4 mr-2" />
                    Save as Template
                  </button>
                  <button className="w-full flex items-center justify-center px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Cart
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;