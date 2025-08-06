#!/bin/bash
set -euo pipefail

# Simple Frontend Deployment for Task 1.7
# Deploy improved frontend code using Cloud Build

PROJECT_ID="aqueous-sundown-591834531941"
SERVICE_NAME="izerwaren-frontend-hotfix"
REGION="us-central1"

echo "🚀 Starting Task 1.7: Deploy Frontend Fixes"
echo "📦 Service: ${SERVICE_NAME}"
echo "🌍 Region: ${REGION}"

cd "$(dirname "$0")/.."

# Deploy using Cloud Build from source
echo "🔨 Building and deploying frontend using Cloud Build..."
gcloud run deploy ${SERVICE_NAME} \
  --source=apps/frontend \
  --region=${REGION} \
  --platform=managed \
  --memory=1Gi \
  --cpu=1 \
  --concurrency=100 \
  --timeout=300 \
  --max-instances=10 \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production,NEXT_TELEMETRY_DISABLED=1,PORT=3000" \
  --project="${PROJECT_ID}"

# Get the service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} \
  --region=${REGION} \
  --format="value(status.url)")

echo "🧪 Testing deployment..."
max_attempts=10
attempt=1
while [ $attempt -le $max_attempts ]; do
  echo "Attempt $attempt/$max_attempts: Testing $SERVICE_URL"
  
  if curl -f -s -m 10 "$SERVICE_URL" | grep -q "Izerwaren"; then
    echo "✅ Deployment test passed!"
    break
  fi
  
  if [ $attempt -eq $max_attempts ]; then
    echo "❌ Deployment test failed after $max_attempts attempts"
    exit 1
  fi
  
  sleep 10
  ((attempt++))
done

echo ""
echo "🎉 Task 1.7 Deployment Complete!"
echo "✅ Frontend fixes deployed successfully"
echo "🌐 Service URL: $SERVICE_URL"
echo ""
echo "Next steps:"
echo "1. Test the updated frontend functionality"
echo "2. Verify environment configuration improvements"
echo "3. Update Task Master status to 'done'"