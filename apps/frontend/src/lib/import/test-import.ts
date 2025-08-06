// Test script for running the hybrid product import

import { HybridProductImporter } from './hybrid-product-importer';
import { ImportProgress } from './types';

async function runTestImport() {
  console.log('🚀 Starting hybrid product import test...');

  const importer = new HybridProductImporter((progress: ImportProgress) => {
    console.log(
      `📊 ${progress.phase}: ${progress.current}/${progress.total} - ${progress.status} ${progress.message || ''}`
    );
  });

  try {
    const result = await importer.importAll();

    if (result.success) {
      console.log('✅ Import completed successfully!');
      console.log('📈 Final stats:', result.stats);
    } else {
      console.log('❌ Import failed:', result.message);
      if (result.errors) {
        console.log('🔴 Errors:', result.errors);
      }
    }
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  runTestImport()
    .then(() => {
      console.log('🏁 Test import script completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Test import script failed:', error);
      process.exit(1);
    });
}
