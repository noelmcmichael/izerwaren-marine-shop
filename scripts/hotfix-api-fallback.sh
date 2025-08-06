#!/bin/bash
set -e

echo "🔧 Applying API fallback hotfix for production..."

# Change to project directory
cd "$(dirname "$0")/.."

# Check current git status
echo "📊 Current git status:"
git status --short

# Add the changes
echo "📝 Adding hotfix changes..."
git add apps/frontend/src/services/mock-products.ts
git add apps/frontend/src/services/resilient-products.ts
git add apps/frontend/src/app/catalog/page.tsx
git add apps/frontend/src/components/home/FeaturedProducts.tsx
git add scripts/hotfix-api-fallback.sh

# Commit the changes
echo "💾 Committing hotfix..."
git commit -m "hotfix: Add API fallback with mock data for production

- Add MockProductService with 947 product dataset
- Add ResilientProductService for API fallback strategy
- Update catalog page to use resilient service
- Update FeaturedProducts component to handle both API formats
- Ensures site works when backend API is not available

This allows the frontend to work immediately in production while
we decide whether to deploy the backend or go Shopify-only.

🤖 Generated with [Memex](https://memex.tech)
Co-Authored-By: Memex <noreply@memex.tech>"

# Build the Docker image with the hotfix
echo "🐳 Building Docker image with hotfix..."
docker build -t gcr.io/izerwaren-revamp-2-0/izerwaren-revamp-2-0-web:hotfix-api-fallback -f Dockerfile .

# Push the image
echo "📤 Pushing hotfix image to registry..."
docker push gcr.io/izerwaren-revamp-2-0/izerwaren-revamp-2-0-web:hotfix-api-fallback

# Deploy the hotfix
echo "🚀 Deploying hotfix to production..."
gcloud run deploy izerwaren-revamp-2-0-web \
  --image gcr.io/izerwaren-revamp-2-0/izerwaren-revamp-2-0-web:hotfix-api-fallback \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 3000 \
  --memory 2Gi \
  --cpu 2 \
  --min-instances 1 \
  --max-instances 10 \
  --concurrency 80 \
  --timeout 300 \
  --vpc-connector projects/izerwaren-revamp-2-0/locations/us-central1/connectors/izerwaren-vpc-connector \
  --set-env-vars NODE_ENV=production \
  --set-env-vars NEXT_PUBLIC_ENVIRONMENT=production \
  --set-env-vars NEXTAUTH_URL=https://izerwaren.mcmichaelbuild.com \
  --set-env-vars NEXT_TELEMETRY_DISABLED=1 \
  --set-env-vars NEXT_PRIVATE_STANDALONE=true \
  --set-env-vars NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=izerwaren.myshopify.com \
  --set-env-vars NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=placeholder_token \
  --set-env-vars SHOPIFY_SHOP_DOMAIN=izerwaren.myshopify.com \
  --set-env-vars SHOPIFY_ADMIN_ACCESS_TOKEN=placeholder_admin_token \
  --set-env-vars FIREBASE_PROJECT_ID=izerwaren-revamp-2-0 \
  --set-env-vars NEXT_PUBLIC_FIREBASE_PROJECT_ID=izerwaren-revamp-2-0 \
  --set-env-vars NEXT_PUBLIC_FIREBASE_API_KEY=placeholder_firebase_key \
  --set-env-vars NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=placeholder_sender_id \
  --set-env-vars NEXT_PUBLIC_FIREBASE_APP_ID=placeholder_app_id \
  --set-secrets DATABASE_URL=DATABASE_URL:latest \
  --set-secrets NEXTAUTH_SECRET=NEXTAUTH_SECRET:latest

echo "✅ Hotfix deployment complete!"
echo "🌐 Site URL: https://izerwaren.mcmichaelbuild.com"

# Wait a moment for deployment to settle
echo "⏳ Waiting for deployment to settle..."
sleep 10

# Test the deployment
echo "🧪 Testing hotfix deployment..."
if curl -f -s "https://izerwaren.mcmichaelbuild.com/" > /dev/null; then
  echo "✅ Site is responding"
else
  echo "❌ Site is not responding"
fi

if curl -f -s "https://izerwaren.mcmichaelbuild.com/catalog" > /dev/null; then
  echo "✅ Catalog page is responding"
else
  echo "❌ Catalog page is not responding"
fi

echo ""
echo "🎯 Hotfix Summary:"
echo "- API fallback system deployed"
echo "- Mock data service with 947 products"
echo "- Resilient service tries API first, falls back to mock data"
echo "- Site should now work even without backend API"
echo ""
echo "🔍 Next steps:"
echo "1. Test the catalog page: https://izerwaren.mcmichaelbuild.com/catalog"
echo "2. Verify featured products on homepage work"
echo "3. Check browser console for API status messages"
echo "4. Decide whether to deploy backend or go full Shopify integration"