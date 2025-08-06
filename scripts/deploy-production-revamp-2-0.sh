#!/bin/bash

# Production Deployment Script for Izerwaren Revamp 2.0
# This script deploys the built images to Cloud Run

set -e

# Configuration
PROJECT_ID="noelmc"
REGION="us-central1"
REPOSITORY="izerwaren-revamp-2-0"
WEB_SERVICE="izerwaren-revamp-2-0-web"
API_SERVICE="izerwaren-revamp-2-0-api"
SERVICE_ACCOUNT="izerwaren-revamp-2-0-run@noelmc.iam.gserviceaccount.com"
VPC_CONNECTOR="izerwaren-revamp-2-0-vpc"

# Check if build metadata exists
if [ ! -f "build-metadata.json" ]; then
  echo "❌ build-metadata.json not found. Please run build script first."
  exit 1
fi

# Extract image URLs from build metadata
WEB_IMAGE=$(jq -r '.images.frontend' build-metadata.json)
API_IMAGE=$(jq -r '.images.backend' build-metadata.json)
BUILD_TAG=$(jq -r '.buildTag' build-metadata.json)

echo "🚀 Deploying Izerwaren Revamp 2.0 to production..."
echo "📋 Build tag: ${BUILD_TAG}"
echo "🌐 Web image: ${WEB_IMAGE}"
echo "🔧 API image: ${API_IMAGE}"

# Deploy frontend to Cloud Run
echo "🌐 Deploying frontend service..."
gcloud run deploy ${WEB_SERVICE} \
  --image="${WEB_IMAGE}" \
  --platform=managed \
  --region=${REGION} \
  --service-account=${SERVICE_ACCOUNT} \
  --vpc-connector=${VPC_CONNECTOR} \
  --vpc-egress=private-ranges-only \
  --allow-unauthenticated \
  --port=3000 \
  --memory=2Gi \
  --cpu=2 \
  --min-instances=1 \
  --max-instances=10 \
  --concurrency=80 \
  --timeout=300 \
  --set-env-vars="NODE_ENV=production" \
  --set-secrets="DATABASE_URL=izerwaren-revamp-2-0-db-url:latest" \
  --set-secrets="NEXTAUTH_SECRET=izerwaren-revamp-2-0-nextauth-secret:latest"

# Deploy backend to Cloud Run (if backend image exists)
if [ "${API_IMAGE}" != "null" ] && [ "${API_IMAGE}" != "" ]; then
  echo "🔧 Deploying backend service..."
  gcloud run deploy ${API_SERVICE} \
    --image="${API_IMAGE}" \
    --platform=managed \
    --region=${REGION} \
    --service-account=${SERVICE_ACCOUNT} \
    --vpc-connector=${VPC_CONNECTOR} \
    --vpc-egress=private-ranges-only \
    --allow-unauthenticated \
    --port=8080 \
    --memory=1Gi \
    --cpu=1 \
    --min-instances=1 \
    --max-instances=25 \
    --concurrency=100 \
    --timeout=300 \
    --set-env-vars="NODE_ENV=production" \
    --set-secrets="DATABASE_URL=izerwaren-revamp-2-0-db-url:latest"
else
  echo "⚠️  Backend image not found, skipping backend deployment"
fi

echo "✅ Deployment completed successfully!"
echo "🌐 Frontend service: https://${WEB_SERVICE}-$(echo ${REGION} | tr -d '-')-uc.a.run.app"
if [ "${API_IMAGE}" != "null" ] && [ "${API_IMAGE}" != "" ]; then
  echo "🔧 Backend service:  https://${API_SERVICE}-$(echo ${REGION} | tr -d '-')-uc.a.run.app"
fi

# Save deployment metadata
echo "💾 Saving deployment metadata..."
cat > deployment-metadata.json << EOF
{
  "deploymentTime": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "buildTag": "${BUILD_TAG}",
  "services": {
    "frontend": {
      "name": "${WEB_SERVICE}",
      "image": "${WEB_IMAGE}",
      "url": "https://${WEB_SERVICE}-$(echo ${REGION} | tr -d '-')-uc.a.run.app"
    },
    "backend": {
      "name": "${API_SERVICE}",
      "image": "${API_IMAGE}",
      "url": "https://${API_SERVICE}-$(echo ${REGION} | tr -d '-')-uc.a.run.app"
    }
  }
}
EOF

echo "📋 Deployment metadata saved to deployment-metadata.json"
echo "🎉 Production deployment complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Test the deployed services"
echo "   2. Configure custom domain mapping"
echo "   3. Update DNS records"
echo "   4. Switch traffic to the new revision"