'use client';

// Force dynamic rendering for test pages
export const dynamic = 'force-dynamic';

import React from 'react';
import { BulkOrderInterface } from '../../components/b2b/cart/BulkOrderInterface';
import { useCart } from '../../services/cart';

export default function TestBulkOrderingPage() {
  const { addItem, addMultipleItems, clearCart } = useCart();

  // Test product data based on our database products
  const testProducts = [
    {
      productId: "gid://shopify/Product/8032471547951",
      name: "Hatch Fastener set - 7/16 inch",
      sku: "IZW-0438"
    },
    {
      productId: "gid://shopify/Product/8032478101551", 
      name: "Door Lock 30mm - Privacy",
      sku: "IZW-0014"
    },
    {
      productId: "gid://shopify/Product/8032482820143",
      name: "Gas Spring Eye End Fitting M8x27mm", 
      sku: "IZW-0338"
    },
    {
      productId: "gid://shopify/Product/8032460341295",
      name: "Door Lock Cylinder Key Set",
      sku: "IZW-0008"
    },
    {
      productId: "gid://shopify/Product/8032460374063",
      name: "Door Lock Cylinder Key Function",
      sku: "IZW-0009"
    }
  ];

  const handleAddTestProducts = () => {
    const items = testProducts.map((product, index) => ({
      productId: product.productId,
      variantId: `${product.productId}-default`,
      quantity: Math.floor(Math.random() * 5) + 1 // Random quantity 1-5
    }));

    addMultipleItems(items);
  };

  const handleClearCart = () => {
    if (confirm('Are you sure you want to clear the cart?')) {
      clearCart();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Bulk Ordering Test
                </h1>
                <p className="text-sm text-gray-600">
                  Phase 4 - Enhanced Pro Account Features Testing Interface
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Phase 4 Testing
                </span>
                <a
                  href="/"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  ← Back to Home
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Test Info */}
        <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Bulk Ordering Interface Test
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Features Being Tested</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Multi-product cart management</li>
                <li>• Quantity controls with validation</li>
                <li>• Tier-based pricing display</li>
                <li>• Bulk upload (CSV/Excel)</li>
                <li>• Cart save/load functionality</li>
                <li>• Product search and selection</li>
                <li>• Export capabilities (CSV/PDF)</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Test Scenarios</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Add products via search modal</li>
                <li>• Upload bulk order from CSV</li>
                <li>• Modify quantities with controls</li>
                <li>• Save cart with custom name</li>
                <li>• Load previously saved cart</li>
                <li>• Export cart summary</li>
                <li>• View tier-based pricing</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Validation Tests</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Minimum quantity enforcement</li>
                <li>• Stock availability checks</li>
                <li>• Tier permission validation</li>
                <li>• File upload validation</li>
                <li>• Cart size limits</li>
                <li>• Price calculation accuracy</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Authentication Status */}
        <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Current Pro Account Session Status
          </h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Customer Profile</h3>
                <div className="bg-gray-50 rounded-md p-3">
                  <p className="text-sm text-gray-600">
                    Company: Demo Marine Supply Co.
                  </p>
                  <p className="text-sm text-gray-600">
                    Tier: PREMIUM (10% discount)
                  </p>
                  <p className="text-sm text-gray-600">
                    Contact: demo@marinesupply.com
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Permissions</h3>
                <div className="bg-gray-50 rounded-md p-3 space-y-1">
                  <div className="flex items-center text-sm">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-600">View Pricing</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-600">Request Quotes</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-600">Place Orders</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-600">Bulk Ordering</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Ordering Interface */}
        <BulkOrderInterface />

        {/* Test Actions */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Quick Test Actions
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button 
              onClick={handleAddTestProducts}
              className="flex flex-col items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-400 transition-colors"
            >
              <svg className="w-8 h-8 text-blue-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="text-sm font-medium text-gray-900">Add Test Products</span>
              <span className="text-xs text-gray-500">Populate cart with 5 sample items</span>
            </button>
            
            <button className="flex flex-col items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50">
              <svg className="w-8 h-8 text-green-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-sm font-medium text-gray-900">Test CSV Upload</span>
              <span className="text-xs text-gray-500">Download & upload sample CSV</span>
            </button>
            
            <button className="flex flex-col items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50">
              <svg className="w-8 h-8 text-purple-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-medium text-gray-900">Quantity Tests</span>
              <span className="text-xs text-gray-500">Test min/max/increment rules</span>
            </button>
            
            <button className="flex flex-col items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50">
              <svg className="w-8 h-8 text-orange-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              <span className="text-sm font-medium text-gray-900">Pricing Tests</span>
              <span className="text-xs text-gray-500">Verify tier discounts & totals</span>
            </button>
          </div>
          
          {/* Additional Test Actions */}
          <div className="mt-4 flex gap-4">
            <button 
              onClick={handleClearCart}
              className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear Cart
            </button>
          </div>
        </div>

        {/* Developer Notes */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-lg font-medium text-yellow-800 mb-4">
            🚧 Development Notes
          </h2>
          
          <div className="space-y-3 text-sm text-yellow-700">
            <p>
              <strong>Phase 4 Progress:</strong> This test page demonstrates the enhanced bulk ordering interface 
              with cart management, pricing calculations, and file upload capabilities.
            </p>
            
            <p>
              <strong>API Status:</strong> Currently using mock data and localStorage for testing. 
              Backend API endpoints need to be implemented for full functionality.
            </p>
            
            <p>
              <strong>Next Steps:</strong> 
              1. Implement cart API endpoints, 
              2. Add quote management system, 
              3. Build order history integration, 
              4. Create enterprise API access features.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}