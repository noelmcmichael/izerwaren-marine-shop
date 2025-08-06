#!/bin/bash

# Production Build Script for Izerwaren Revamp 2.0
# This script builds Docker images and pushes them to Artifact Registry

set -e

# Configuration
PROJECT_ID="noelmc"
REGION="us-central1"
REPOSITORY="izerwaren-revamp-2-0"
WEB_IMAGE="izerwaren-revamp-2-0-web"
API_IMAGE="izerwaren-revamp-2-0-api"

# Generate version tag from git commit (shortened for Cloud Run tag limits)
VERSION_TAG=$(git rev-parse --short HEAD)
TIMESTAMP=$(date +%m%d-%H%M)
BUILD_TAG="${TIMESTAMP}-${VERSION_TAG}"

# Docker image URLs for Artifact Registry
WEB_IMAGE_URL="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${WEB_IMAGE}"
API_IMAGE_URL="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${API_IMAGE}"

echo "🚀 Building Izerwaren Revamp 2.0 production images..."
echo "📋 Build tag: ${BUILD_TAG}"
echo "🌐 Web image: ${WEB_IMAGE_URL}:${BUILD_TAG}"
echo "🔧 API image: ${API_IMAGE_URL}:${BUILD_TAG}"

# Ensure we're in the project root
cd "$(dirname "$0")/.."

# Build frontend image
echo "🏗️  Building frontend image..."
docker build \
  --target production \
  --tag "${WEB_IMAGE_URL}:${BUILD_TAG}" \
  --tag "${WEB_IMAGE_URL}:latest" \
  --file Dockerfile \
  .

# Build backend image (if Dockerfile.backend exists)
if [ -f "Dockerfile.backend" ]; then
  echo "🏗️  Building backend image..."
  docker build \
    --tag "${API_IMAGE_URL}:${BUILD_TAG}" \
    --tag "${API_IMAGE_URL}:latest" \
    --file Dockerfile.backend \
    .
else
  echo "⚠️  Dockerfile.backend not found, skipping backend build"
fi

# Push images to Artifact Registry
echo "📤 Pushing images to Artifact Registry..."

echo "📤 Pushing frontend image..."
docker push "${WEB_IMAGE_URL}:${BUILD_TAG}"
docker push "${WEB_IMAGE_URL}:latest"

if [ -f "Dockerfile.backend" ]; then
  echo "📤 Pushing backend image..."
  docker push "${API_IMAGE_URL}:${BUILD_TAG}"
  docker push "${API_IMAGE_URL}:latest"
fi

echo "✅ Build completed successfully!"
echo "📝 Images built:"
echo "   Frontend: ${WEB_IMAGE_URL}:${BUILD_TAG}"
if [ -f "Dockerfile.backend" ]; then
  echo "   Backend:  ${API_IMAGE_URL}:${BUILD_TAG}"
fi

# Save build metadata
echo "💾 Saving build metadata..."
cat > build-metadata.json << EOF
{
  "buildTime": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "buildTag": "${BUILD_TAG}",
  "gitCommit": "$(git rev-parse HEAD)",
  "gitBranch": "$(git rev-parse --abbrev-ref HEAD)",
  "images": {
    "frontend": "${WEB_IMAGE_URL}:${BUILD_TAG}",
    "backend": "${API_IMAGE_URL}:${BUILD_TAG}"
  }
}
EOF

echo "📋 Build metadata saved to build-metadata.json"
echo "🎉 Production build complete!"