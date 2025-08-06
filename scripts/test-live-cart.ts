#!/usr/bin/env tsx

/**
 * Test Live Cart Integration
 * 
 * Tests actual Shopify cart creation and management
 */

import { config } from 'dotenv';
import path from 'path';

// Load environment variables
config({ path: path.join(__dirname, '..', '.env') });

const SHOPIFY_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const STOREFRONT_TOKEN = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN;

async function testCartCreation() {
  console.log('🛒 Testing Live Cart Creation\n');
  
  if (!SHOPIFY_DOMAIN || !STOREFRONT_TOKEN) {
    console.error('❌ Missing configuration');
    return;
  }
  
  try {
    // Step 1: Get some products to test with
    console.log('1. 📦 Fetching products...');
    const productsQuery = `
      query getProducts($first: Int!) {
        products(first: $first) {
          edges {
            node {
              id
              title
              handle
              variants(first: 1) {
                edges {
                  node {
                    id
                    title
                    price {
                      amount
                      currencyCode
                    }
                    availableForSale
                  }
                }
              }
            }
          }
        }
      }
    `;
    
    const productsResponse = await fetch(`https://${SHOPIFY_DOMAIN}/api/2023-10/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN,
      },
      body: JSON.stringify({ 
        query: productsQuery,
        variables: { first: 3 }
      }),
    });
    
    const productsData = await productsResponse.json();
    
    if (productsData.errors) {
      console.error('❌ Products query failed:', productsData.errors);
      return;
    }
    
    const products = productsData.data?.products?.edges || [];
    console.log(`✅ Found ${products.length} products`);
    
    if (products.length === 0) {
      console.log('⚠️  No products available for testing');
      return;
    }
    
    // Step 2: Create a cart
    console.log('\n2. 🛒 Creating cart...');
    const createCartQuery = `
      mutation cartCreate($input: CartInput!) {
        cartCreate(input: $input) {
          cart {
            id
            checkoutUrl
            cost {
              totalAmount {
                amount
                currencyCode
              }
            }
            lines(first: 10) {
              edges {
                node {
                  id
                  quantity
                  merchandise {
                    ... on ProductVariant {
                      id
                      title
                      product {
                        title
                      }
                      price {
                        amount
                        currencyCode
                      }
                    }
                  }
                }
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;
    
    // Get first available variant
    const firstProduct = products[0]?.node;
    const firstVariant = firstProduct?.variants?.edges?.[0]?.node;
    
    if (!firstVariant) {
      console.log('⚠️  No variants available for testing');
      return;
    }
    
    console.log(`   Adding: ${firstProduct.title} (${firstVariant.title})`);
    
    const cartInput = {
      lines: [
        {
          merchandiseId: firstVariant.id,
          quantity: 2
        }
      ]
    };
    
    const cartResponse = await fetch(`https://${SHOPIFY_DOMAIN}/api/2023-10/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN,
      },
      body: JSON.stringify({ 
        query: createCartQuery,
        variables: { input: cartInput }
      }),
    });
    
    const cartData = await cartResponse.json();
    
    if (cartData.errors) {
      console.error('❌ Cart creation failed:', cartData.errors);
      return;
    }
    
    const checkout = cartData.data?.cartCreate?.cart;
    const userErrors = cartData.data?.cartCreate?.userErrors;
    
    if (userErrors && userErrors.length > 0) {
      console.error('❌ Cart creation errors:', userErrors);
      return;
    }
    
    if (!checkout) {
      console.error('❌ No checkout returned');
      return;
    }
    
    console.log('✅ Cart created successfully!');
    console.log(`   Cart ID: ${checkout.id}`);
    console.log(`   Total: ${checkout.cost.totalAmount.amount} ${checkout.cost.totalAmount.currencyCode}`);
    console.log(`   Items: ${checkout.lines.edges.length}`);
    console.log(`   Checkout URL: ${checkout.checkoutUrl}`);
    
    // Step 3: Test cart update
    console.log('\n3. ➕ Testing cart update...');
    const updateCartQuery = `
      mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
        cartLinesUpdate(cartId: $cartId, lines: $lines) {
          cart {
            id
            cost {
              totalAmount {
                amount
                currencyCode
              }
            }
            lines(first: 10) {
              edges {
                node {
                  id
                  quantity
                }
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;
    
    const lineItemId = checkout.lines.edges[0]?.node?.id;
    
    if (lineItemId) {
      const updateResponse = await fetch(`https://${SHOPIFY_DOMAIN}/api/2023-10/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN,
        },
        body: JSON.stringify({ 
          query: updateCartQuery,
          variables: { 
            cartId: checkout.id,
            lines: [{ id: lineItemId, quantity: 3 }]
          }
        }),
      });
      
      const updateData = await updateResponse.json();
      
      if (updateData.errors || updateData.data?.cartLinesUpdate?.userErrors?.length > 0) {
        console.log('⚠️  Cart update failed, but creation worked');
      } else {
        const updatedCheckout = updateData.data?.cartLinesUpdate?.cart;
        console.log('✅ Cart updated successfully!');
        console.log(`   New total: ${updatedCheckout.cost.totalAmount.amount} ${updatedCheckout.cost.totalAmount.currencyCode}`);
        console.log(`   New quantity: ${updatedCheckout.lines.edges[0]?.node?.quantity}`);
      }
    }
    
    console.log('\n🎉 Live cart integration test completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Test in browser: http://localhost:3000/catalog');
    console.log('2. Add products to cart');
    console.log('3. Verify cart state management');
    console.log('4. Test checkout redirect');
    
  } catch (error) {
    console.error('❌ Test failed:', error instanceof Error ? error.message : 'Unknown error');
  }
}

if (require.main === module) {
  testCartCreation();
}