'use client';

import React from 'react';
import { useCustomerAuth } from '../../providers/CustomerAuthProvider';
import { useProductPricing } from '../../services/pricing';

interface PricingDisplayProps {
  shopifyProductId: string;
  basePrice: number;
  retailPrice?: number;
  quantity?: number;
  variantId?: string;
  priceModifiers?: number;
  showTierBenefits?: boolean;
}

/**
 * Enhanced B2B Pricing Display with Customer Tier Integration
 */
export function PricingDisplay({
  shopifyProductId,
  basePrice,
  retailPrice,
  quantity = 1,
  variantId,
  priceModifiers = 0,
  showTierBenefits = true,
}: PricingDisplayProps) {
  const { customer, authenticated, getTierBenefits } = useCustomerAuth();
  const {
    pricing,
    quantityBreaks,
    isLoading,
    tierBenefits,
    formatPrice,
    calculateSavings,
  } = useProductPricing(shopifyProductId, basePrice, quantity, variantId);

  // Show loading state
  if (isLoading) {
    return (
      <div className='pricing-display animate-pulse'>
        <div className='space-y-3'>
          <div className='h-4 bg-gray-200 rounded w-3/4'></div>
          <div className='h-6 bg-gray-200 rounded w-1/2'></div>
          <div className='h-4 bg-gray-200 rounded w-2/3'></div>
        </div>
      </div>
    );
  }

  const finalBasePrice = basePrice + priceModifiers;
  const customerPrice = pricing?.dealer_price || finalBasePrice;
  const savings = calculateSavings(finalBasePrice, customerPrice);

  return (
    <div className='pricing-display'>
      <div className='space-y-3'>
        {/* Base Price */}
        <div className='flex justify-between items-center'>
          <span className='text-sm text-gray-600'>List Price:</span>
          <span className='text-sm font-medium'>{formatPrice(basePrice)}</span>
        </div>

        {/* Variant Modifiers */}
        {priceModifiers > 0 && (
          <div className='flex justify-between items-center'>
            <span className='text-sm text-gray-600'>Options:</span>
            <span className='text-sm font-medium text-green-600'>
              +{formatPrice(priceModifiers)}
            </span>
          </div>
        )}

        {/* Quantity */}
        {quantity > 1 && (
          <div className='flex justify-between items-center'>
            <span className='text-sm text-gray-600'>Quantity:</span>
            <span className='text-sm font-medium'>{quantity} units</span>
          </div>
        )}

        {/* Subtotal (before customer discount) */}
        {(priceModifiers > 0 || authenticated) && (
          <div className='flex justify-between items-center border-t pt-2'>
            <span className='text-sm text-gray-600'>Subtotal:</span>
            <span className='text-sm font-medium'>{formatPrice(finalBasePrice)}</span>
          </div>
        )}

        {/* Customer Discount */}
        {authenticated && pricing && savings.amount > 0 && (
          <div className='flex justify-between items-center'>
            <span className='text-sm text-gray-600'>
              {customer?.profile?.tier} Discount ({savings.formatted_percent}):
            </span>
            <span className='text-sm font-medium text-green-600'>
              -{savings.formatted_amount}
            </span>
          </div>
        )}

        {/* Final Price */}
        <div className='flex justify-between items-center border-t pt-3'>
          <span className='text-lg font-semibold text-gray-900'>
            {authenticated ? 'Your Price:' : 'Price:'}
          </span>
          <div className='text-right'>
            <span className='text-2xl font-bold text-gray-900'>
              {formatPrice(customerPrice)}
            </span>
            {authenticated && customer?.profile?.tier && (
              <div className='text-xs text-green-600'>{customer.profile.tier} pricing</div>
            )}
          </div>
        </div>

        {/* Retail Price Comparison */}
        {retailPrice && retailPrice > customerPrice && (
          <div className='text-center pt-2 border-t'>
            <div className='text-sm text-gray-500'>
              Retail: <span className='line-through'>{formatPrice(retailPrice)}</span>
            </div>
            <div className='text-sm font-medium text-green-600'>
              You save {formatPrice(retailPrice - customerPrice)} (
              {(((retailPrice - customerPrice) / retailPrice) * 100).toFixed(0)}%)
            </div>
          </div>
        )}

        {/* Quantity Breaks */}
        {quantityBreaks.length > 0 && (
          <div className='pt-3 border-t'>
            <div className='text-sm font-medium text-gray-700 mb-2'>Volume Pricing:</div>
            <div className='space-y-1'>
              {quantityBreaks.slice(0, 3).map((qb, index) => (
                <div key={index} className='flex justify-between text-xs text-gray-600'>
                  <span>
                    {qb.min_quantity}+ units:
                  </span>
                  <span className='font-medium'>
                    {formatPrice(qb.price_per_unit)} each
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tier Benefits */}
      {showTierBenefits && authenticated && (
        <div className='mt-4 p-3 bg-green-50 border border-green-200 rounded-lg'>
          <div className='text-sm text-green-800'>
            <div className='font-medium mb-1'>
              {customer?.profile?.tier} Member Benefits
            </div>
            <div className='text-xs space-y-1'>
              <div>• {tierBenefits.pricing_discount}% off list prices</div>
              {tierBenefits.credit_terms && <div>• Extended credit terms</div>}
              {tierBenefits.priority_support && <div>• Priority customer support</div>}
            </div>
          </div>
        </div>
      )}

      {/* Account Benefits Notice */}
      {!authenticated && (
        <div className='mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
          <div className='text-sm text-blue-800'>
            <div className='font-medium mb-1'>Get Professional Pricing</div>
            <div className='text-xs space-y-1'>
              <div>• Standard: 10% discount</div>
              <div>• Premium: 15% discount + priority support</div>
              <div>• Enterprise: 20% discount + custom terms</div>
            </div>
            <button className='mt-2 text-xs font-medium text-blue-600 hover:text-blue-800'>
              Sign in or Request Account →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PricingDisplay;
