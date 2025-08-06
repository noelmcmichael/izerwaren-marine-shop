#!/bin/bash
set -e

# Quick Task 10 Frontend Deployment
# Build locally and deploy to Cloud Run

PROJECT_ID="noelmc"
REGION="us-central1"
SERVICE_NAME="izerwaren-revamp-2-0-web"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}:task10-$(date +%s)"

echo "🚀 Quick Task 10 Frontend Deployment"
echo "🏗️  Building frontend locally..."

cd apps/frontend

# Ensure clean build
rm -rf .next
npm run build

echo "📦 Creating Docker image..."

# Create optimized Dockerfile for pre-built app
cat > Dockerfile.deploy << 'EOF'
FROM node:18-alpine
WORKDIR /app

# Copy built application
COPY .next/standalone ./
COPY .next/static ./.next/static
COPY public ./public

# Set environment
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

EXPOSE 3000

CMD ["node", "server.js"]
EOF

# Build and push image
docker build -f Dockerfile.deploy -t ${IMAGE_NAME} .
docker push ${IMAGE_NAME}

echo "🚀 Deploying to Cloud Run..."

# Deploy to Cloud Run
gcloud run deploy ${SERVICE_NAME} \
  --image=${IMAGE_NAME} \
  --region=${REGION} \
  --platform=managed \
  --memory=2Gi \
  --cpu=2 \
  --concurrency=80 \
  --timeout=300 \
  --max-instances=10 \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production,NEXT_TELEMETRY_DISABLED=1,PORT=3000,NEXTAUTH_URL=https://izerwaren.mcmichaelbuild.com" \
  --project=${PROJECT_ID}

echo "✅ Task 10 Frontend Deployed!"
echo "🌐 URL: https://izerwaren.mcmichaelbuild.com"
echo "🔍 Test: https://izerwaren.mcmichaelbuild.com/api/specifications?productId=test-product-1"