import { NextResponse } from 'next/server';
import { config } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET() {
  const shopifyDomain = config.shopify.storeDomain;
  const storefront_token = config.shopify.storefrontAccessToken;

  return NextResponse.json({
    shopifyDomain: shopifyDomain || 'NOT_SET',
    hasStorefrontToken: !!storefront_token,
    tokenLength: storefront_token?.length || 0,
    tokenPreview: storefront_token
      ? `${storefront_token.slice(0, 4)}...${storefront_token.slice(-4)}`
      : 'NOT_SET',
    allEnvVars: Object.keys(process.env).filter(key => key.includes('SHOPIFY')),
  });
}
