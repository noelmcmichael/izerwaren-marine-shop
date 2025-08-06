#!/usr/bin/env python3
"""
Batch migration script for remaining configuration centralization
"""

import os
import re
from pathlib import Path

def migrate_frontend_files():
    """Migrate frontend files to use centralized config"""
    
    frontend_files = [
        "apps/frontend/src/services/resilient-products.ts",
        "apps/frontend/src/services/cart.ts",
        "apps/frontend/src/services/shopify.ts",
        "apps/frontend/src/app/categories/page.tsx",
        "apps/frontend/src/app/search/page.tsx",
        "apps/frontend/src/app/catalog/components/FilterSidebar.tsx",
        "apps/frontend/src/components/shared/CategoryDropdown.tsx",
        "apps/frontend/src/components/shared/CategoryCards.tsx",
        "apps/frontend/src/components/catalog/CategoryFilter.tsx",
        "apps/frontend/src/components/products/VariantSelector.tsx",
        "apps/frontend/src/components/b2b/cart/ProductSearchModal.tsx",
    ]
    
    for file_path in frontend_files:
        if not os.path.exists(file_path):
            continue
            
        print(f"📝 Migrating {file_path}")
        
        with open(file_path, 'r') as f:
            content = f.read()
        
        # Check if config import already exists
        if "import { config }" in content:
            print(f"   ✅ Already migrated")
            continue
            
        # Add config import after other imports
        if "process.env.NEXT_PUBLIC_API_URL" in content:
            # Add import after the last import line
            lines = content.split('\n')
            import_insert_index = 0
            
            for i, line in enumerate(lines):
                if line.strip().startswith('import '):
                    import_insert_index = i + 1
            
            lines.insert(import_insert_index, "import { config } from '@/lib/config';")
            
            # Replace API URL patterns
            content = '\n'.join(lines)
            content = re.sub(r'const API_BASE_URL = process\.env\.NEXT_PUBLIC_API_URL \|\| [\'"][^\'"]*[\'"];?', '', content)
            content = re.sub(r'process\.env\.NEXT_PUBLIC_API_URL \|\| [\'"][^\'"]*[\'"]', 'config.api.baseUrl', content)
            content = re.sub(r'API_BASE_URL', 'config.api.baseUrl', content)
            
            with open(file_path, 'w') as f:
                f.write(content)
            
            print(f"   ✅ Migrated API configuration")

def migrate_component_files():
    """Migrate component files with environment variable usage"""
    
    component_files = [
        "apps/frontend/src/components/admin/AuthProvider.tsx",
        "apps/frontend/src/components/admin/ProtectedRoute.tsx",
        "apps/frontend/src/components/shared/ShopifyImage.tsx",
        "apps/frontend/src/components/product/EnhancedProductCard.tsx",
    ]
    
    for file_path in component_files:
        if not os.path.exists(file_path):
            continue
            
        print(f"📝 Migrating {file_path}")
        
        with open(file_path, 'r') as f:
            content = f.read()
        
        # Check if config import already exists
        if "import { config }" in content:
            print(f"   ✅ Already migrated")
            continue
            
        # Add config import and replace environment variables
        if "process.env." in content:
            # Add import after other imports
            lines = content.split('\n')
            import_insert_index = 0
            
            for i, line in enumerate(lines):
                if line.strip().startswith('import '):
                    import_insert_index = i + 1
            
            lines.insert(import_insert_index, "import { config } from '@/lib/config';")
            content = '\n'.join(lines)
            
            # Replace common environment variable patterns
            replacements = {
                "process.env.NEXT_PUBLIC_DEV_MODE === 'true'": "config.firebase.devMode",
                "process.env.NEXT_PUBLIC_ENVIRONMENT": "config.environment",
                "process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID": "config.firebase.projectId",
                "process.env.NEXT_PUBLIC_FIREBASE_API_KEY": "config.firebase.apiKey",
                "process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID": "config.firebase.messagingSenderId",
                "process.env.NEXT_PUBLIC_FIREBASE_APP_ID": "config.firebase.appId",
                "process.env.NODE_ENV === 'development'": "config.isDevelopment",
                "process.env.NODE_ENV": "config.environment",
            }
            
            for pattern, replacement in replacements.items():
                content = content.replace(pattern, replacement)
            
            with open(file_path, 'w') as f:
                f.write(content)
            
            print(f"   ✅ Migrated environment variables")

def migrate_api_routes():
    """Migrate API route files"""
    
    api_files = [
        "apps/frontend/src/app/api/products/route.ts",
        "apps/frontend/src/app/api/products/route-simple.ts",
        "apps/frontend/src/app/api/debug/shopify/route.ts",
    ]
    
    for file_path in api_files:
        if not os.path.exists(file_path):
            continue
            
        print(f"📝 Migrating {file_path}")
        
        with open(file_path, 'r') as f:
            content = f.read()
        
        # Check if config import already exists
        if "import { config }" in content:
            print(f"   ✅ Already migrated")
            continue
            
        # Add config import and replace Shopify environment variables
        if "process.env.NEXT_PUBLIC_SHOPIFY" in content:
            # Add import after other imports
            lines = content.split('\n')
            import_insert_index = 0
            
            for i, line in enumerate(lines):
                if line.strip().startswith('import '):
                    import_insert_index = i + 1
            
            lines.insert(import_insert_index, "import { config } from '@/lib/config';")
            content = '\n'.join(lines)
            
            # Replace Shopify configuration
            content = content.replace("process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN", "config.shopify.storeDomain")
            content = content.replace("process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN", "config.shopify.storefrontAccessToken")
            content = content.replace("process.env.NODE_ENV", "config.environment")
            
            with open(file_path, 'w') as f:
                f.write(content)
            
            print(f"   ✅ Migrated Shopify configuration")

def main():
    """Run batch migration"""
    print("🔄 Running batch configuration migration...")
    print("=" * 50)
    
    migrate_frontend_files()
    print()
    migrate_component_files() 
    print()
    migrate_api_routes()
    
    print("=" * 50)
    print("✅ Batch migration completed!")

if __name__ == "__main__":
    main()