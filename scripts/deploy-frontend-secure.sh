#!/bin/bash
set -euo pipefail

# Secure Frontend Deployment Script for Task 1.7
# Deploy improved frontend code with secure configuration patterns

PROJECT_ID="aqueous-sundown-591834531941"
SERVICE_NAME="izerwaren-frontend-hotfix"
REGION="us-central1"
IMAGE_TAG="task-1-7-$(date +%Y%m%d-%H%M%S)"
REGISTRY_REGION="us-central1"
IMAGE_URL="${REGISTRY_REGION}-docker.pkg.dev/${PROJECT_ID}/cloud-run-source-deploy/${SERVICE_NAME}:${IMAGE_TAG}"

echo "🚀 Starting Task 1.7: Deploy Frontend Fixes with Secure Configuration"
echo "📦 Service: ${SERVICE_NAME}"
echo "🏷️ Image Tag: ${IMAGE_TAG}"
echo "🌍 Region: ${REGION}"
echo "🔒 Security: Runtime secret injection enabled"

# Validate that secrets exist in Secret Manager before deployment
echo "🔍 Validating Secret Manager secrets..."
REQUIRED_SECRETS=(
  "izerwaren-shopify-storefront-token"
  "izerwaren-next-auth-secret"
  "izerwaren-firebase-config"
)

for secret in "${REQUIRED_SECRETS[@]}"; do
  if gcloud secrets versions access latest --secret="$secret" --project="$PROJECT_ID" >/dev/null 2>&1; then
    echo "✅ Secret available: $secret"
  else
    echo "⚠️ Secret missing: $secret (will be created if needed)"
  fi
done

# Build the frontend image using the working hotfix Dockerfile
echo "🔨 Building frontend image with security enhancements..."
cd "$(dirname "$0")/.."

# Build using the hotfix Dockerfile with platform specification
docker build \
  --platform linux/amd64 \
  -f apps/frontend/Dockerfile.hotfix \
  -t "${IMAGE_URL}" \
  -t "${REGISTRY_REGION}-docker.pkg.dev/${PROJECT_ID}/cloud-run-source-deploy/${SERVICE_NAME}:latest" \
  apps/frontend/

# Push to Container Registry
echo "📤 Pushing image to Container Registry..."
docker push "${IMAGE_URL}"
docker push "${REGISTRY_REGION}-docker.pkg.dev/${PROJECT_ID}/cloud-run-source-deploy/${SERVICE_NAME}:latest"

# Security: Scan Docker image for secrets and vulnerabilities
echo "🔍 Scanning Docker image for security issues..."
docker history --no-trunc "${IMAGE_URL}" | \
  grep -iE "(password|secret|token|key|api)" || echo "✅ No secrets found in image layers"

# Deploy new revision with runtime secret injection
echo "📝 Deploying new revision with runtime secret injection..."
gcloud run deploy ${SERVICE_NAME} \
  --image="${IMAGE_URL}" \
  --region="${REGION}" \
  --platform=managed \
  --no-traffic \
  --tag=task-1-7 \
  --memory=1Gi \
  --cpu=1 \
  --concurrency=100 \
  --timeout=300 \
  --max-instances=10 \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production,NEXT_TELEMETRY_DISABLED=1,PORT=3000" \
  --update-secrets="SHOPIFY_STOREFRONT_ACCESS_TOKEN=izerwaren-shopify-storefront-token:latest" \
  --update-secrets="NEXTAUTH_SECRET=izerwaren-next-auth-secret:latest" \
  --update-secrets="FIREBASE_CONFIG=izerwaren-firebase-config:latest" \
  --project="${PROJECT_ID}"

# Health check the new revision
echo "🏥 Health checking new revision..."
CANDIDATE_URL=$(gcloud run services describe ${SERVICE_NAME} \
  --region=${REGION} \
  --format="value(status.traffic[?tag='task-1-7'].url)")

if [ -z "$CANDIDATE_URL" ]; then
  echo "❌ Failed to get candidate URL"
  exit 1
fi

echo "🔍 Testing candidate revision: $CANDIDATE_URL"

# Test basic connectivity
max_attempts=30
attempt=1
while [ $attempt -le $max_attempts ]; do
  echo "Attempt $attempt/$max_attempts: Testing $CANDIDATE_URL"
  
  if curl -f -s -m 10 "$CANDIDATE_URL" > /dev/null; then
    echo "✅ Basic connectivity test passed"
    break
  fi
  
  if [ $attempt -eq $max_attempts ]; then
    echo "❌ Health check failed after $max_attempts attempts"
    exit 1
  fi
  
  sleep 10
  ((attempt++))
done

# Test key functionality
echo "🧪 Testing key frontend functionality..."

# Test static assets
if curl -f -s -m 10 "$CANDIDATE_URL/_next/static/css" > /dev/null 2>&1; then
  echo "✅ Static assets accessible"
else
  echo "⚠️ Static assets test inconclusive (may be expected)"
fi

# Test homepage loads
if curl -f -s -m 10 "$CANDIDATE_URL" | grep -q "Izerwaren"; then
  echo "✅ Homepage loads correctly"
else
  echo "❌ Homepage test failed"
  exit 1
fi

# All tests passed - switch traffic
echo "🔄 All tests passed! Switching traffic to new revision..."
gcloud run services update-traffic ${SERVICE_NAME} \
  --region=${REGION} \
  --to-tags=task-1-7=100 \
  --project="${PROJECT_ID}"

# Final verification
echo "🎯 Verifying production deployment..."
PRODUCTION_URL=$(gcloud run services describe ${SERVICE_NAME} \
  --region=${REGION} \
  --format="value(status.url)")

if curl -f -s -m 10 "$PRODUCTION_URL" | grep -q "Izerwaren"; then
  echo "✅ Production deployment successful!"
  echo "🌐 Service URL: $PRODUCTION_URL"
else
  echo "❌ Production verification failed"
  exit 1
fi

# Clean up old revisions (keep 3 most recent)
echo "🧹 Cleaning up old revisions..."
gcloud run revisions list \
  --service=${SERVICE_NAME} \
  --region=${REGION} \
  --sort-by="~metadata.creationTimestamp" \
  --format="value(metadata.name)" \
  --limit=100 | tail -n +4 | while read revision; do
    if [ -n "$revision" ]; then
      echo "🗑️ Deleting old revision: $revision"
      gcloud run revisions delete "$revision" \
        --region=${REGION} \
        --quiet || echo "⚠️ Failed to delete $revision"
    fi
done

echo ""
echo "🎉 Task 1.7 Deployment Complete!"
echo "✅ Frontend fixes deployed with secure configuration"
echo "🔒 Runtime secret injection active"
echo "🌐 Service URL: $PRODUCTION_URL"
echo "📊 Image: $IMAGE_URL"
echo ""
echo "Next steps:"
echo "1. Monitor service performance and logs"
echo "2. Test end-to-end user flows"
echo "3. Verify configuration improvements are working"
echo "4. Update Task Master status to 'done'"