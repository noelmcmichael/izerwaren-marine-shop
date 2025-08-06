#!/bin/bash
set -euo pipefail

# Optimized Deployment Script
# Simplified, faster deployment with smart validation

PROJECT_ID=${PROJECT_ID}
IMAGE_URL=${IMAGE_URL}
SERVICE_NAME=${SERVICE_NAME}
REGION=${REGION}

echo "🚀 Starting optimized deployment for ${SERVICE_NAME}"
echo "📦 Image: ${IMAGE_URL}"
echo "🌍 Region: ${REGION}"

# Quick validation of critical secrets only
echo "🔍 Validating critical secrets..."
CRITICAL_SECRETS=(
  "izerwaren-db-password"
  "izerwaren-shopify-admin-token"
)

for secret in "${CRITICAL_SECRETS[@]}"; do
  if gcloud secrets versions access latest --secret="$secret" --project="$PROJECT_ID" --quiet >/dev/null 2>&1; then
    echo "✅ $secret"
  else
    echo "❌ Missing critical secret: $secret"
    exit 1
  fi
done

# Check if service exists
if gcloud run services describe ${SERVICE_NAME} --region=${REGION} --quiet >/dev/null 2>&1; then
  echo "🔄 Updating existing service"
  DEPLOYMENT_TYPE="update"
else
  echo "🆕 Creating new service"
  DEPLOYMENT_TYPE="create"
fi

# Deploy with optimized settings
echo "📝 Deploying with runtime secret injection..."
gcloud run deploy ${SERVICE_NAME} \
  --image=${IMAGE_URL} \
  --region=${REGION} \
  --platform=managed \
  --port=3000 \
  --memory=512Mi \
  --cpu=1 \
  --concurrency=100 \
  --max-instances=10 \
  --min-instances=0 \
  --timeout=300 \
  --no-traffic \
  --tag=candidate \
  --set-env-vars="NODE_ENV=production,PORT=3000" \
  --set-secrets="DATABASE_URL=izerwaren-db-password:latest,SHOPIFY_ADMIN_ACCESS_TOKEN=izerwaren-shopify-admin-token:latest" \
  --allow-unauthenticated \
  --quiet

# Quick health check
echo "🏥 Testing candidate revision..."
CANDIDATE_URL=$(gcloud run services describe ${SERVICE_NAME} --region=${REGION} --format="value(status.traffic[0].url)" | head -1)

if [ -n "$CANDIDATE_URL" ]; then
  # Simple health check with timeout
  if timeout 30s curl -sSf "${CANDIDATE_URL}" > /dev/null 2>&1; then
    echo "✅ Health check passed"
    
    # Gradual traffic migration
    echo "🚦 Migrating traffic to new revision..."
    gcloud run services update-traffic ${SERVICE_NAME} \
      --region=${REGION} \
      --to-tags=candidate=100 \
      --quiet
    
    echo "🎉 Deployment successful!"
    echo "🌐 Service URL: $(gcloud run services describe ${SERVICE_NAME} --region=${REGION} --format='value(status.url)')"
  else
    echo "❌ Health check failed"
    echo "🔍 Check logs: gcloud logging read 'resource.type=cloud_run_revision AND resource.labels.service_name=${SERVICE_NAME}' --limit=50"
    exit 1
  fi
else
  echo "❌ Could not get candidate URL"
  exit 1
fi

echo "✅ Deployment completed successfully!"