// Simple database query to get product data
import { Client } from 'pg';

async function getProducts() {
  const client = new Client({
    connectionString: 'postgresql://noelmcmichael@localhost:5432/izerwaren_dev?schema=public'
  });

  try {
    await client.connect();
    
    // Check what tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%product%' OR table_name LIKE '%variant%'
      ORDER BY table_name;
    `);
    
    console.log('🗂️  Product-related tables:');
    tablesResult.rows.forEach(row => console.log(`   - ${row.table_name}`));
    console.log('');

    // Get sample products
    const productsResult = await client.query(`
      SELECT 
        id,
        title,
        sku,
        shopify_product_id
      FROM products 
      LIMIT 5;
    `);
    
    console.log('📦 Sample products:');
    productsResult.rows.forEach((product, index) => {
      console.log(`${index + 1}. ${product.title}`);
      console.log(`   ID: ${product.id}`);
      console.log(`   SKU: ${product.sku}`);
      console.log(`   Shopify Product ID: ${product.shopify_product_id}`);
      console.log('');
    });

    // Check variant count and structure first
    const variantCountResult = await client.query(`SELECT COUNT(*) FROM product_variants;`);
    console.log(`📊 Total variants: ${variantCountResult.rows[0].count}`);
    
    // Check columns in product_variants
    const columnsResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'product_variants' 
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Product variants table structure:');
    columnsResult.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type}`);
    });
    console.log('');

    // Get sample variants
    const variantsResult = await client.query(`
      SELECT * FROM product_variants LIMIT 3;
    `);
    
    console.log('🔧 Sample variants:');
    variantsResult.rows.forEach((variant, index) => {
      console.log(`${index + 1}. ${variant.title || 'Default'}`);
      console.log(`   Variant ID: ${variant.shopify_variant_id}`);
      console.log(`   SKU: ${variant.sku}`);
      console.log(`   Price: $${variant.price}`);
      console.log(`   Product ID: ${variant.product_id}`);
      console.log('');
    });

    // Generate test commands with real data
    if (productsResult.rows.length > 0 && variantsResult.rows.length > 0) {
      const product = productsResult.rows[0];
      const variant = variantsResult.rows[0];
      
      console.log('🧪 Test cart API with real data:');
      console.log('');
      console.log('Add item to cart:');
      console.log(`curl -X POST http://localhost:3001/api/v1/customers/cart/items \\`);
      console.log(`  -H "Content-Type: application/json" \\`);
      console.log(`  -d '{"productId": "${product.shopify_product_id}", "variantId": "${variant.shopify_variant_id}", "quantity": 2}'`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

getProducts();