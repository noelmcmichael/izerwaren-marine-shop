const fetch = require('node-fetch');

async function testFrontendEndpoints() {
  console.log('🌐 FRONTEND FUNCTIONALITY TEST');
  console.log('===============================\n');

  const baseUrl = 'http://localhost:3000';
  const apiUrl = 'http://localhost:3001';

  // 1. Test backend API endpoints
  console.log('1. BACKEND API ENDPOINTS');
  console.log('========================');
  
  try {
    // Test products endpoint
    const productsResponse = await fetch(`${apiUrl}/api/v1/products?limit=5`);
    const productsData = await productsResponse.json();
    
    if (productsResponse.ok) {
      console.log(`✅ Products API: ${productsData.products?.length || 0} products returned`);
      
      // Check first product structure
      if (productsData.products && productsData.products.length > 0) {
        const firstProduct = productsData.products[0];
        console.log(`   Sample product: ${firstProduct.sku} - $${firstProduct.price}`);
        console.log(`   Images: ${firstProduct.images?.length || 0}`);
        console.log(`   Catalogs: ${firstProduct.catalogs?.length || 0}`);
      }
    } else {
      console.log(`❌ Products API failed: ${productsResponse.status}`);
    }
  } catch (error) {
    console.log(`❌ Products API error: ${error.message}`);
  }

  try {
    // Test search endpoint
    const searchResponse = await fetch(`${apiUrl}/api/v1/products/search?q=lock&limit=3`);
    const searchData = await searchResponse.json();
    
    if (searchResponse.ok) {
      console.log(`✅ Search API: ${searchData.products?.length || 0} results for "lock"`);
    } else {
      console.log(`❌ Search API failed: ${searchResponse.status}`);
    }
  } catch (error) {
    console.log(`❌ Search API error: ${error.message}`);
  }

  try {
    // Test categories endpoint
    const categoriesResponse = await fetch(`${apiUrl}/api/v1/categories`);
    const categoriesData = await categoriesResponse.json();
    
    if (categoriesResponse.ok) {
      console.log(`✅ Categories API: ${categoriesData.length || 0} categories`);
    } else {
      console.log(`❌ Categories API failed: ${categoriesResponse.status}`);
    }
  } catch (error) {
    console.log(`❌ Categories API error: ${error.message}`);
  }

  // 2. Test specific product endpoints
  console.log('\n2. SPECIFIC PRODUCT TESTS');
  console.log('==========================');
  
  const testSkus = ['IZW-0950', 'IZW-0944', 'IZW-0948'];
  
  for (const sku of testSkus) {
    try {
      const productResponse = await fetch(`${apiUrl}/api/v1/products/${sku}`);
      const productData = await productResponse.json();
      
      if (productResponse.ok) {
        console.log(`✅ Product ${sku}: ${productData.title}`);
        console.log(`   Price: $${productData.price}`);
        console.log(`   Images: ${productData.images?.length || 0}`);
        console.log(`   Catalogs: ${productData.catalogs?.length || 0}`);
        
        // Check image structure
        if (productData.images && productData.images.length > 0) {
          const firstImage = productData.images[0];
          console.log(`   First image: ${firstImage.localPath ? 'Local path exists' : 'No local path'}`);
        }
      } else {
        console.log(`❌ Product ${sku} failed: ${productResponse.status}`);
      }
    } catch (error) {
      console.log(`❌ Product ${sku} error: ${error.message}`);
    }
  }

  // 3. Test frontend pages (basic connectivity)
  console.log('\n3. FRONTEND PAGE CONNECTIVITY');
  console.log('==============================');
  
  const frontendPages = [
    '/',
    '/catalog',
    '/product/IZW-0950',
    '/product/IZW-0944'
  ];
  
  for (const page of frontendPages) {
    try {
      const pageResponse = await fetch(`${baseUrl}${page}`, {
        method: 'HEAD', // Just check if page loads
        timeout: 5000
      });
      
      if (pageResponse.ok) {
        console.log(`✅ Page ${page}: ${pageResponse.status}`);
      } else {
        console.log(`❌ Page ${page}: ${pageResponse.status}`);
      }
    } catch (error) {
      console.log(`❌ Page ${page} error: ${error.message}`);
    }
  }

  console.log('\n🌐 Frontend Functionality Test Complete\n');
}

// Run the frontend tests
testFrontendEndpoints()
  .catch(console.error);