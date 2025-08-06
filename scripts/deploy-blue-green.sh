#!/bin/bash
set -euo pipefail

# Blue/Green deployment script for Cloud Run
# Deploys new revision with 0% traffic, validates health, then switches traffic

PROJECT_ID=${PROJECT_ID}
IMAGE_URL=${IMAGE_URL}
SERVICE_NAME=${SERVICE_NAME}
REGION=${REGION}

echo "🚀 Starting blue/green deployment for ${SERVICE_NAME}"
echo "📦 Image: ${IMAGE_URL}"
echo "🌍 Region: ${REGION}"

# Deploy new revision with 0% traffic
echo "📝 Deploying new revision with 0% traffic..."
gcloud run deploy ${SERVICE_NAME} \
  --image=${IMAGE_URL} \
  --region=${REGION} \
  --platform=managed \
  --no-traffic \
  --tag=candidate \
  --set-env-vars="NODE_ENV=production" \
  --memory=1Gi \
  --cpu=1 \
  --concurrency=100 \
  --max-instances=10 \
  --allow-unauthenticated

# Get the candidate revision URL
CANDIDATE_URL=$(gcloud run services describe ${SERVICE_NAME} \
  --region=${REGION} \
  --format="value(status.traffic[0].url)" \
  --filter="metadata.labels.serving-knative-dev/configuration=${SERVICE_NAME}")

echo "🔍 Health checking candidate revision: ${CANDIDATE_URL}"

# Health check with retries
for i in {1..5}; do
  echo "Health check attempt ${i}/5..."
  if curl -f -s "${CANDIDATE_URL}/api/health" > /dev/null; then
    echo "✅ Health check passed!"
    break
  else
    if [ $i -eq 5 ]; then
      echo "❌ Health check failed after 5 attempts. Rolling back..."
      gcloud run services update-traffic ${SERVICE_NAME} \
        --region=${REGION} \
        --remove-tags=candidate
      exit 1
    fi
    echo "⏳ Health check failed, retrying in 10 seconds..."
    sleep 10
  fi
done

# Switch 100% traffic to new revision
echo "🔄 Switching traffic to new revision..."
gcloud run services update-traffic ${SERVICE_NAME} \
  --region=${REGION} \
  --to-latest

echo "🎉 Blue/green deployment completed successfully!"

# Clean up old revisions (keep last 3)
echo "🧹 Cleaning up old revisions..."
REVISIONS=$(gcloud run revisions list \
  --service=${SERVICE_NAME} \
  --region=${REGION} \
  --sort-by="~metadata.creationTimestamp" \
  --format="value(metadata.name)" \
  --limit=100)

# Convert to array and keep only the latest 3
REVISION_ARRAY=($REVISIONS)
if [ ${#REVISION_ARRAY[@]} -gt 3 ]; then
  for ((i=3; i<${#REVISION_ARRAY[@]}; i++)); do
    echo "🗑️  Deleting old revision: ${REVISION_ARRAY[$i]}"
    gcloud run revisions delete ${REVISION_ARRAY[$i]} \
      --region=${REGION} \
      --quiet || true
  done
fi

echo "✨ Deployment pipeline completed!"