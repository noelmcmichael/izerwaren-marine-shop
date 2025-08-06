'use client';

import React from 'react';
import { useSavedCarts } from '../../../services/cart';

interface SavedCartsModalProps {
  onClose: () => void;
  onLoadCart?: (cartId: string) => void; // eslint-disable-line no-unused-vars
}

export function SavedCartsModal({ onClose, onLoadCart }: SavedCartsModalProps) {
  const { data: savedCarts, isLoading } = useSavedCarts();

  const handleLoadCart = (cartId: string) => {
    if (onLoadCart) {
      onLoadCart(cartId);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Saved Carts</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <svg className="animate-spin h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : savedCarts && savedCarts.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {savedCarts.map((cart) => (
                <div
                  key={cart.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {cart.name || `Cart ${cart.id.slice(0, 8)}`}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {cart.item_count} items • ${cart.total_value.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-400">
                        Saved {new Date(cart.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleLoadCart(cart.id)}
                      className="ml-4 px-3 py-2 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100"
                    >
                      Load Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h1.586a1 1 0 01.707.293L9 6.5M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No saved carts</h3>
              <p className="mt-1 text-sm text-gray-500">
                Save your current cart to reuse it later.
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}