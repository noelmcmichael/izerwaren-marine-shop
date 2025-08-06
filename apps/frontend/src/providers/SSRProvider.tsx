'use client';

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

// Loading fallback for SSR
function ProviderFallback({ children }: { children: ReactNode }) {
  return <div className="min-h-screen">{children}</div>;
}

// Dynamically import all providers with SSR disabled
const ClientProviders = dynamic(
  () => import('./index').then(mod => ({ default: mod.Providers })),
  { 
    ssr: false,
    loading: () => <ProviderFallback>{}</ProviderFallback>
  }
);

interface SSRProviderProps {
  children: ReactNode;
}

/**
 * SSR-Safe Provider Wrapper
 * 
 * Prevents React context issues during static generation by:
 * - Loading providers only on client-side
 * - Providing fallback during SSR
 * - Maintaining hydration consistency
 */
export function SSRProvider({ children }: SSRProviderProps) {
  return (
    <ClientProviders>
      {children}
    </ClientProviders>
  );
}