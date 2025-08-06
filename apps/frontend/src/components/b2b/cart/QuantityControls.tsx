'use client';

import React, { useState, useEffect } from 'react';
import type { CartItem } from '../../../types/cart';

interface QuantityControlsProps {
  item: CartItem;
  onUpdate: (quantity: number) => void;
  onRemove: () => void;
  size?: 'sm' | 'md' | 'lg';
  showRemove?: boolean;
  disabled?: boolean;
}

export function QuantityControls({ 
  item, 
  onUpdate, 
  onRemove, 
  size = 'md', 
  showRemove = true, 
  disabled = false 
}: QuantityControlsProps) {
  const [quantity, setQuantity] = useState(item.quantity);
  const [isUpdating, setIsUpdating] = useState(false);

  // Sync local state with prop changes
  useEffect(() => {
    setQuantity(item.quantity);
  }, [item.quantity]);

  const handleQuantityChange = async (newQuantity: number) => {
    if (disabled || isUpdating) return;

    // Validate quantity
    const minQty = item.minimum_quantity || 1;
    const increment = item.quantity_increments || 1;
    
    // Ensure quantity meets minimum
    if (newQuantity < minQty) {
      newQuantity = minQty;
    }
    
    // Ensure quantity meets increment requirements
    if (item.quantity_increments && newQuantity % increment !== 0) {
      newQuantity = Math.ceil(newQuantity / increment) * increment;
    }

    // Check stock limits
    if (item.stock_quantity && newQuantity > item.stock_quantity) {
      newQuantity = item.stock_quantity;
    }

    setQuantity(newQuantity);
    setIsUpdating(true);
    
    try {
      await onUpdate(newQuantity);
    } catch (error) {
      // Revert on error
      setQuantity(item.quantity);
      console.error('Failed to update quantity:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    setQuantity(value);
  };

  const handleInputBlur = () => {
    if (quantity !== item.quantity) {
      handleQuantityChange(quantity);
    }
  };

  const handleInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    }
  };

  const increment = () => {
    const step = item.quantity_increments || 1;
    handleQuantityChange(quantity + step);
  };

  const decrement = () => {
    const step = item.quantity_increments || 1;
    const minQty = item.minimum_quantity || 1;
    const newQty = Math.max(quantity - step, minQty);
    handleQuantityChange(newQty);
  };

  const sizeClasses = {
    sm: {
      container: 'flex items-center space-x-1',
      button: 'w-6 h-6 text-xs',
      input: 'w-12 h-6 text-xs',
      remove: 'w-6 h-6 text-xs'
    },
    md: {
      container: 'flex items-center space-x-2',
      button: 'w-8 h-8 text-sm',
      input: 'w-16 h-8 text-sm',
      remove: 'w-8 h-8 text-sm'
    },
    lg: {
      container: 'flex items-center space-x-3',
      button: 'w-10 h-10 text-base',
      input: 'w-20 h-10 text-base',
      remove: 'w-10 h-10 text-base'
    }
  };

  const classes = sizeClasses[size];

  return (
    <div className={classes.container}>
      {/* Decrease Button */}
      <button
        onClick={decrement}
        disabled={disabled || isUpdating || quantity <= (item.minimum_quantity || 1)}
        className={`${classes.button} border border-gray-300 rounded-md flex items-center justify-center text-gray-600 hover:text-gray-800 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
      </button>

      {/* Quantity Input */}
      <input
        type="number"
        value={quantity}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onKeyPress={handleInputKeyPress}
        disabled={disabled || isUpdating}
        min={item.minimum_quantity || 1}
        step={item.quantity_increments || 1}
        max={item.stock_quantity}
        className={`${classes.input} border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed`}
      />

      {/* Increase Button */}
      <button
        onClick={increment}
        disabled={disabled || isUpdating || (item.stock_quantity && quantity >= item.stock_quantity)}
        className={`${classes.button} border border-gray-300 rounded-md flex items-center justify-center text-gray-600 hover:text-gray-800 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>

      {/* Remove Button */}
      {showRemove && (
        <button
          onClick={onRemove}
          disabled={disabled || isUpdating}
          className={`${classes.remove} border border-red-300 rounded-md flex items-center justify-center text-red-600 hover:text-red-800 hover:border-red-400 disabled:opacity-50 disabled:cursor-not-allowed`}
          title="Remove item"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}

      {/* Loading Indicator */}
      {isUpdating && (
        <div className="ml-2">
          <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}

      {/* Validation Messages */}
      <div className="ml-2">
        {!item.in_stock && (
          <span className="text-xs text-red-600 font-medium">Out of Stock</span>
        )}
        {item.minimum_quantity && quantity < item.minimum_quantity && (
          <span className="text-xs text-yellow-600">
            Min: {item.minimum_quantity}
          </span>
        )}
        {item.stock_quantity && quantity > item.stock_quantity && (
          <span className="text-xs text-red-600">
            Only {item.stock_quantity} available
          </span>
        )}
        {item.quantity_increments && quantity % item.quantity_increments !== 0 && (
          <span className="text-xs text-yellow-600">
            Increments of {item.quantity_increments}
          </span>
        )}
      </div>
    </div>
  );
}