#!/bin/bash

# Optimized Build Script for Izerwaren
# Simplifies the build process and improves performance

set -e

echo "🚀 Starting optimized Izerwaren build..."

# Configuration
IMAGE_NAME=${IMAGE_NAME:-"izerwaren-frontend"}
TAG=${TAG:-"latest"}
BUILD_MODE=${BUILD_MODE:-"production"}

# Build arguments
BUILD_ARGS=""
if [ ! -z "$BUILD_VERSION" ]; then
  BUILD_ARGS="$BUILD_ARGS --build-arg BUILD_VERSION=$BUILD_VERSION"
fi

if [ ! -z "$BUILD_TIMESTAMP" ]; then
  BUILD_ARGS="$BUILD_ARGS --build-arg BUILD_TIMESTAMP=$BUILD_TIMESTAMP"
fi

echo "📦 Building Docker image: $IMAGE_NAME:$TAG"

# Use simple Dockerfile for faster builds
docker build \
  -f Dockerfile.simple \
  -t "$IMAGE_NAME:$TAG" \
  $BUILD_ARGS \
  .

echo "✅ Build completed successfully!"

# Optional: Run basic validation
if [ "$VALIDATE_BUILD" = "true" ]; then
  echo "🔍 Validating build..."
  
  # Start container temporarily for health check
  CONTAINER_ID=$(docker run -d -p 3001:3000 "$IMAGE_NAME:$TAG")
  
  # Wait for startup
  sleep 10
  
  # Health check
  if curl -f http://localhost:3001 > /dev/null 2>&1; then
    echo "✅ Health check passed!"
  else
    echo "❌ Health check failed!"
    exit 1
  fi
  
  # Cleanup
  docker stop $CONTAINER_ID
  docker rm $CONTAINER_ID
fi

echo "🎉 Optimized build process complete!"

# Display image size
docker images "$IMAGE_NAME:$TAG" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"