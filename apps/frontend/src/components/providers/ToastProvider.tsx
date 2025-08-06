/**
 * Toast Provider Component
 * Task 9.5: Product Comparison and Recently Viewed Features
 * 
 * Provides toast notifications throughout the application
 * with consistent styling and positioning.
 */

'use client';

import React from 'react';
import { Toaster } from 'react-hot-toast';

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        containerClassName=""
        containerStyle={{}}
        toastOptions={{
          // Default options
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            fontSize: '14px',
            maxWidth: '500px',
          },
          
          // Success toasts
          success: {
            duration: 3000,
            style: {
              background: '#059669',
              color: '#fff',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#059669',
            },
          },
          
          // Error toasts
          error: {
            duration: 5000,
            style: {
              background: '#DC2626',
              color: '#fff',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#DC2626',
            },
          },
          
          // Loading toasts
          loading: {
            style: {
              background: '#3B82F6',
              color: '#fff',
            },
          },
        }}
      />
    </>
  );
}

export default ToastProvider;