'use client';

import React from 'react';
import type { CartSummary as CartSummaryType } from '../../../types/cart';
import { useCustomerAuth } from '../../../providers/CustomerAuthProvider';

interface CartSummaryProps {
  cart: CartSummaryType;
  showCheckout?: boolean;
  onRequestQuote?: () => void;
  onCheckout?: () => void;
}

export function CartSummary({ cart, showCheckout = true, onRequestQuote, onCheckout }: CartSummaryProps) {
  const { customer } = useCustomerAuth();

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Order Summary</h3>
      </div>
      
      <div className="px-6 py-4 space-y-4">
        {/* Basic Totals */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Items ({cart.item_count})</span>
            <span className="text-gray-900">{cart.total_quantity} units</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="text-gray-900">{formatCurrency(cart.subtotal)}</span>
          </div>
          
          {cart.tier_discount_percent > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-green-600">
                {customer?.profile?.tier} Tier Discount ({cart.tier_discount_percent}%)
              </span>
              <span className="text-green-600">
                -{formatCurrency(cart.subtotal * (cart.tier_discount_percent / 100))}
              </span>
            </div>
          )}
          
          {cart.volume_discounts_applied.length > 0 && (
            <div className="space-y-1">
              {cart.volume_discounts_applied.map((discount, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-green-600">
                    Volume Discount ({discount.min_quantity}+ units, {discount.discount_percent}%)
                  </span>
                  <span className="text-green-600">
                    -{formatCurrency(cart.subtotal * (discount.discount_percent / 100))}
                  </span>
                </div>
              ))}
            </div>
          )}
          
          {cart.total_discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-green-600">Total Discounts</span>
              <span className="text-green-600">-{formatCurrency(cart.total_discount)}</span>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 pt-4">
          {cart.estimated_tax !== undefined && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Estimated Tax</span>
              <span className="text-gray-900">{formatCurrency(cart.estimated_tax)}</span>
            </div>
          )}
          
          {cart.estimated_shipping !== undefined && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Estimated Shipping</span>
              <span className="text-gray-900">{formatCurrency(cart.estimated_shipping)}</span>
            </div>
          )}
        </div>

        {/* Savings Display */}
        {cart.savings_from_list_price > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-medium text-green-800">
                  You&apos;re saving {formatCurrency(cart.savings_from_list_price)}
                </p>
                <p className="text-xs text-green-600">
                  Compared to list prices
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Total */}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex justify-between">
            <span className="text-base font-medium text-gray-900">Estimated Total</span>
            <span className="text-lg font-semibold text-gray-900">
              {formatCurrency(cart.total_estimated)}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Final pricing will be confirmed at checkout
          </p>
        </div>

        {/* Tier Information */}
        {customer?.profile && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">
                  {customer.profile.tier} Tier Benefits
                </p>
                <p className="text-xs text-blue-600">
                  {customer.profile.tier === 'STANDARD' && 'Upgrade to Premium for 10% discount'}
                  {customer.profile.tier === 'PREMIUM' && 'Enjoying 10% tier discount'}
                  {customer.profile.tier === 'ENTERPRISE' && 'Enjoying 15% tier discount + API access'}
                </p>
              </div>
              {customer.profile.tier === 'STANDARD' && (
                <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                  Upgrade
                </button>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {showCheckout && cart.items.length > 0 && (
          <div className="space-y-3 pt-4">
            {customer?.pricing_access.can_request_quotes && (
              <button
                onClick={onRequestQuote}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Request Custom Quote
              </button>
            )}
            
            {customer?.pricing_access.can_place_orders && (
              <button
                onClick={onCheckout}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Proceed to Checkout
              </button>
            )}
            
            {!customer?.pricing_access.can_place_orders && (
              <div className="text-center p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  Contact your account manager to enable online ordering
                </p>
                <button className="text-sm text-yellow-600 hover:text-yellow-800 font-medium mt-1">
                  Contact Us
                </button>
              </div>
            )}
          </div>
        )}

        {/* Minimum Order Notice */}
        {customer?.profile?.tier === 'STANDARD' && cart.total_estimated < 500 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-400 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Minimum order: $500.00
                </p>
                <p className="text-xs text-yellow-600">
                  Add {formatCurrency(500 - cart.total_estimated)} more to meet minimum
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}