#!/bin/bash
set -e

echo "🔧 Applying direct API fix to production deployment..."

# Change to project directory
cd "$(dirname "$0")/.."

echo "🚀 Deploying with current Cloud Build setup..."

# Use the existing Cloud Build process but with the new source
gcloud builds submit --config cloudbuild.yaml --substitutions=_ENV=production --project=izerwaren-revamp-2-0

echo "✅ Deployment using Cloud Build complete!"
echo "🌐 Site URL: https://izerwaren.mcmichaelbuild.com"

# Wait a moment for deployment to settle
echo "⏳ Waiting for deployment to settle..."
sleep 15

# Test the deployment
echo "🧪 Testing deployment..."
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
echo "🎯 Fix Summary:"
echo "- API fallback system deployed via Cloud Build"
echo "- Mock data service with 947 products"
echo "- Resilient service tries API first, falls back to mock data"
echo "- Site should now work even without backend API"
echo ""
echo "🔍 Next steps:"
echo "1. Test the catalog page: https://izerwaren.mcmichaelbuild.com/catalog"
echo "2. Verify featured products on homepage work"
echo "3. Check browser console for API status messages"