import type { Metadata, Viewport } from 'next';
import React from 'react';
import './globals.css';
import { SSRProvider } from '../providers/SSRProvider';
import { MainHeader } from '../components/navigation/MainHeader';
import { Footer } from '../components/navigation/Footer';
import { PageErrorBoundary } from '../components/error-boundary';
// import ComparisonBar from './comparison/components/ComparisonBar'; // Temporarily disabled for production stability

export const metadata: Metadata = {
  title: 'Izerwaren - Marine Hardware & Industrial Supplies',
  description: 'Marine grade hardware and fittings for yachts, ships, and ocean residences. Professional marine hardware, fasteners, and industrial supplies for business customers and individual buyers.',
  keywords: 'marine hardware, yacht fittings, stainless steel hardware, boat parts, marine fasteners, industrial supplies',
  openGraph: {
    title: 'Izerwaren - Marine Hardware & Industrial Supplies',
    description: 'Marine grade hardware and fittings for yachts, ships, and ocean residences. Professional marine hardware, fasteners, and industrial supplies.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Izerwaren',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Izerwaren - Marine Hardware & Industrial Supplies',
    description: 'Marine grade hardware and fittings for yachts, ships, and ocean residences.',
  },
  icons: {
    icon: '/images/izerwaren_logo_new.png',
    apple: '/images/izerwaren_logo_new.png',
  },
  robots: 'index, follow',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <body>
        <SSRProvider>
          <PageErrorBoundary>
            <MainHeader />
            {children}
            <Footer />
            {/* <ComparisonBar /> */} {/* Temporarily disabled for production stability */}
          </PageErrorBoundary>
        </SSRProvider>
      </body>
    </html>
  );
}