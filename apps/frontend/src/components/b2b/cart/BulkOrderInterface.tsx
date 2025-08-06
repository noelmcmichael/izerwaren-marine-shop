'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useCart, useSavedCarts, useCartValidation } from '../../../services/cart';
import { useCustomerAuth } from '../../../providers/CustomerAuthProvider';
import { CartSummary } from './CartSummary';
import { QuantityControls } from './QuantityControls';
import { BulkUploadModal } from './BulkUploadModal';
import { SavedCartsModal } from './SavedCartsModal';
import { ProductSearchModal } from './ProductSearchModal';

export function BulkOrderInterface() {
  const { customer } = useCustomerAuth();
  const { cart, updateQuantity, removeItem, clearCart, exportCart, saveCart } = useCart();
  const { data: savedCarts } = useSavedCarts();
  const { data: validationResults } = useCartValidation();
  
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showSavedCarts, setShowSavedCarts] = useState(false);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleExport = async (format: 'csv' | 'pdf') => {
    setIsExporting(true);
    try {
      const blob = await exportCart(format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bulk-order-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveCart = async () => {
    const name = prompt('Enter a name for this cart (optional):');
    if (name === null) return; // User cancelled
    
    setIsSaving(true);
    try {
      await saveCart(name || undefined);
      alert('Cart saved successfully!');
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save cart. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // TODO: Re-enable authentication check after testing
  // For testing purposes, bypass authentication requirement
  // if (!customer) {
  //   return (
  //     <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg">
  //       <div className="text-center">
  //         <h3 className="text-lg font-medium text-gray-900 mb-2">Pro Account Access Required</h3>
  //         <p className="text-gray-600">Please sign in with your Pro Account to access bulk ordering.</p>
  //       </div>
  //     </div>
  //   );
  // }

  const hasErrors = validationResults?.some(result => result.severity === 'error');
  const hasWarnings = validationResults?.some(result => result.severity === 'warning');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Bulk Order Center</h2>
              <p className="text-sm text-gray-600 mt-1">
                Build your order with quantity-based pricing for {customer?.profile?.company_name || 'Demo Marine Supply Co.'}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {customer?.profile?.tier || 'PREMIUM'} TIER
              </span>
              {(customer?.pricing_access?.can_view_pricing !== false) && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Pricing Enabled
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowProductSearch(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Products
              </button>
              
              <button
                onClick={() => setShowBulkUpload(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Bulk Upload
              </button>
              
              <button
                onClick={() => setShowSavedCarts(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                Saved Carts ({savedCarts?.length || 0})
              </button>
            </div>

            {cart.items.length > 0 && (
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleSaveCart}
                  disabled={isSaving}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Cart'}
                </button>
                
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleExport('csv')}
                    disabled={isExporting}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-l-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    CSV
                  </button>
                  <button
                    onClick={() => handleExport('pdf')}
                    disabled={isExporting}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-r-md border-l-0 shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    PDF
                  </button>
                </div>
                
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to clear your cart?')) {
                      clearCart();
                    }
                  }}
                  className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50"
                >
                  Clear Cart
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Validation Messages */}
      {(hasErrors || hasWarnings) && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Cart Validation</h3>
            <div className="space-y-2">
              {validationResults?.map((result, index) => (
                <div
                  key={index}
                  className={`flex items-start space-x-3 p-3 rounded-md ${
                    result.severity === 'error' 
                      ? 'bg-red-50 border border-red-200' 
                      : result.severity === 'warning'
                      ? 'bg-yellow-50 border border-yellow-200'
                      : 'bg-blue-50 border border-blue-200'
                  }`}
                >
                  <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                    result.severity === 'error' ? 'bg-red-100' : result.severity === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'
                  }`}>
                    {result.severity === 'error' ? '!' : result.severity === 'warning' ? '⚠' : 'i'}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      result.severity === 'error' ? 'text-red-800' : result.severity === 'warning' ? 'text-yellow-800' : 'text-blue-800'
                    }`}>
                      {result.message}
                    </p>
                    {result.suggested_action && (
                      <p className={`text-sm mt-1 ${
                        result.severity === 'error' ? 'text-red-600' : result.severity === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                      }`}>
                        Suggestion: {result.suggested_action}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Cart Items */}
      {cart.items.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Cart Items ({cart.item_count})
            </h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {cart.items.map((item) => (
              <div key={item.id} className="px-6 py-4">
                <div className="flex items-center space-x-4">
                  {/* Product Image */}
                  {item.image_url && (
                    <div className="flex-shrink-0">
                      <Image
                        src={item.image_url}
                        alt={item.title}
                        width={64}
                        height={64}
                        className="w-16 h-16 object-cover rounded-md border border-gray-200"
                      />
                    </div>
                  )}
                  
                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {item.title}
                    </h4>
                    {item.variant_title && (
                      <p className="text-sm text-gray-500">{item.variant_title}</p>
                    )}
                    <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                    {!item.in_stock && (
                      <p className="text-sm text-red-600 font-medium">Out of Stock</p>
                    )}
                  </div>
                  
                  {/* Quantity Controls */}
                  <div className="flex-shrink-0">
                    <QuantityControls
                      item={item}
                      onUpdate={(quantity) => updateQuantity({ itemId: item.id, quantity })}
                      onRemove={() => removeItem(item.id)}
                    />
                  </div>
                  
                  {/* Pricing */}
                  <div className="flex-shrink-0 text-right">
                    <div className="text-sm font-medium text-gray-900">
                      ${item.total_price.toFixed(2)}
                    </div>
                    {item.discount_percent > 0 && (
                      <div className="text-sm text-gray-500 line-through">
                        ${(item.list_price * item.quantity).toFixed(2)}
                      </div>
                    )}
                    <div className="text-xs text-gray-500">
                      ${item.unit_price.toFixed(2)} each
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Your cart is empty</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding products to your bulk order.</p>
            <div className="mt-6">
              <button
                onClick={() => setShowProductSearch(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Products
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Summary */}
      {cart.items.length > 0 && (
        <CartSummary cart={cart} />
      )}

      {/* Modals */}
      {showBulkUpload && (
        <BulkUploadModal onClose={() => setShowBulkUpload(false)} />
      )}
      
      {showSavedCarts && (
        <SavedCartsModal onClose={() => setShowSavedCarts(false)} />
      )}
      
      {showProductSearch && (
        <ProductSearchModal onClose={() => setShowProductSearch(false)} />
      )}
    </div>
  );
}