// Temporarily disable Sentry for build troubleshooting
// const { withSentryConfig } = require('@sentry/nextjs');
const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  eslint: {
    // Disable ESLint during production builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript checks during production builds for faster builds
    ignoreBuildErrors: process.env.NODE_ENV === 'production',
  },
  // Force dynamic rendering for all pages to avoid static generation issues
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
        port: '',
        pathname: '/s/files/**',
      },
      {
        protocol: 'https',
        hostname: process.env.LEGACY_IMAGE_DOMAIN || 'izerwaren.biz',
        port: '',
        pathname: '/Content/images/**',
      },
    ],
  },
  // Prevent static optimization of pages that use API routes during build
  staticPageGenerationTimeout: 180,
  // Skip API routes during build
  trailingSlash: false,
  output: 'standalone',
};

// Sentry configuration options
const sentryWebpackPluginOptions = {
  // Additional config options for the Sentry Webpack plugin
  silent: true, // Suppresses source map uploading logs during build
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  
  // Enable source maps upload only in production
  widenClientFileUpload: true,
  tunnelRoute: '/monitoring/sentry-tunnel',
  hideSourceMaps: true,
  disableLogger: true,
  
  // Enable automatic release creation
  automaticVercelMonitors: false,
};

// Temporarily disable Sentry for build troubleshooting
// module.exports = withNextIntl(withSentryConfig(nextConfig, sentryWebpackPluginOptions));
module.exports = withNextIntl(nextConfig);
