'use client';
import { config } from '@/lib/config';

import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { SWRConfig } from 'swr';

import { queryClient, swrConfig } from '../lib/react-query';
import AuthProvider from '../components/admin/AuthProvider';
import { CustomerAuthProvider } from './CustomerAuthProvider';
import { CartProvider } from './CartProvider';
import { ToastProvider } from '../components/shared/Toast';

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * SWR Fetcher function for API calls
 */
const fetcher = async (url: string) => {
  const response = await fetch(url);
  
  if (!response.ok) {
    const error = new Error('An error occurred while fetching the data.');
    // Attach extra info to the error object
    (error as any).info = await response.json();
    (error as any).status = response.status;
    throw error;
  }
  
  return response.json();
};

/**
 * Combined Providers Component
 * 
 * Wraps the application with all necessary providers for:
 * - React Query (for server state management)
 * - SWR (for client-side data fetching)
 * - Future: Authentication, Theme, etc.
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <SWRConfig
        value={{
          fetcher,
          ...swrConfig,
        }}
      >
        <ToastProvider>
          <AuthProvider>
            <CustomerAuthProvider>
              <CartProvider>
                {children}
                
                {/* React Query DevTools (only in development) */}
                {config.environment === 'development' && (
                  <ReactQueryDevtools 
                    initialIsOpen={false} 
                    position="bottom-right"
                  />
                )}
              </CartProvider>
            </CustomerAuthProvider>
          </AuthProvider>
        </ToastProvider>
      </SWRConfig>
    </QueryClientProvider>
  );
}

export default Providers;