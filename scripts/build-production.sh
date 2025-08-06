#!/bin/bash
set -euo pipefail

# Production build script for Izerwaren Revamp 2.0
# Builds and pushes Docker images to Google Container Registry

echo "🔨 Starting production build for Izerwaren Revamp 2.0"

# Configuration
PROJECT_ID=${PROJECT_ID:-"noelmc"}
BUILD_ID=${BUILD_ID:-$(date +%Y%m%d-%H%M%S)}
REGISTRY="gcr.io"

echo "📋 Build Configuration:"
echo "  Project: ${PROJECT_ID}"
echo "  Build ID: ${BUILD_ID}"
echo "  Registry: ${REGISTRY}"

# Frontend image configuration
FRONTEND_IMAGE="${REGISTRY}/${PROJECT_ID}/izerwaren-frontend"
FRONTEND_TAG_VERSIONED="${FRONTEND_IMAGE}:${BUILD_ID}"
FRONTEND_TAG_LATEST="${FRONTEND_IMAGE}:latest"

# Backend image configuration  
BACKEND_IMAGE="${REGISTRY}/${PROJECT_ID}/izerwaren-api"
BACKEND_TAG_VERSIONED="${BACKEND_IMAGE}:${BUILD_ID}"
BACKEND_TAG_LATEST="${BACKEND_IMAGE}:latest"

echo ""
echo "🏷️ Image Tags:"
echo "  Frontend Versioned: ${FRONTEND_TAG_VERSIONED}"
echo "  Frontend Latest: ${FRONTEND_TAG_LATEST}"
echo "  Backend Versioned: ${BACKEND_TAG_VERSIONED}"
echo "  Backend Latest: ${BACKEND_TAG_LATEST}"

# Function to check Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        echo "❌ Docker is not running. Please start Docker and try again."
        exit 1
    fi
    echo "✅ Docker is running"
}

# Function to configure Docker for GCR
configure_docker_gcr() {
    echo "🔐 Configuring Docker for Google Container Registry..."
    gcloud auth configure-docker gcr.io --quiet
    echo "✅ Docker configured for GCR"
}

# Function to build frontend
build_frontend() {
    echo "🌐 Building frontend image..."
    
    # Build the image
    docker build \
        --target production \
        --tag ${FRONTEND_TAG_VERSIONED} \
        --tag ${FRONTEND_TAG_LATEST} \
        --file Dockerfile \
        --build-arg NODE_ENV=production \
        .
    
    echo "✅ Frontend image built successfully"
}

# Function to build backend  
build_backend() {
    echo "🖥️ Building backend image..."
    
    # Build the image
    docker build \
        --target production \
        --tag ${BACKEND_TAG_VERSIONED} \
        --tag ${BACKEND_TAG_LATEST} \
        --file apps/backend/Dockerfile \
        --build-arg NODE_ENV=production \
        .
    
    echo "✅ Backend image built successfully"
}

# Function to push images
push_images() {
    echo "📤 Pushing images to Google Container Registry..."
    
    # Push frontend images
    echo "  📤 Pushing frontend images..."
    docker push ${FRONTEND_TAG_VERSIONED}
    docker push ${FRONTEND_TAG_LATEST}
    
    # Push backend images
    echo "  📤 Pushing backend images..."
    docker push ${BACKEND_TAG_VERSIONED}
    docker push ${BACKEND_TAG_LATEST}
    
    echo "✅ All images pushed successfully"
}

# Function to verify images
verify_images() {
    echo "🔍 Verifying images in registry..."
    
    # Check frontend image
    if gcloud container images describe ${FRONTEND_TAG_VERSIONED} >/dev/null 2>&1; then
        echo "✅ Frontend image verified in registry"
    else
        echo "❌ Frontend image not found in registry"
        return 1
    fi
    
    # Check backend image
    if gcloud container images describe ${BACKEND_TAG_VERSIONED} >/dev/null 2>&1; then
        echo "✅ Backend image verified in registry"
    else
        echo "❌ Backend image not found in registry"
        return 1
    fi
}

# Function to run security scan (optional)
security_scan() {
    echo "🛡️ Running security scans on images..."
    
    # Scan frontend image
    echo "  🔍 Scanning frontend image..."
    gcloud container images scan ${FRONTEND_TAG_VERSIONED} --quiet || echo "⚠️ Frontend scan completed with warnings"
    
    # Scan backend image
    echo "  🔍 Scanning backend image..."
    gcloud container images scan ${BACKEND_TAG_VERSIONED} --quiet || echo "⚠️ Backend scan completed with warnings"
    
    echo "✅ Security scans completed"
}

# Function to clean up local images (optional)
cleanup_local() {
    echo "🧹 Cleaning up local images..."
    
    # Remove local images to save space
    docker rmi ${FRONTEND_TAG_VERSIONED} ${FRONTEND_TAG_LATEST} ${BACKEND_TAG_VERSIONED} ${BACKEND_TAG_LATEST} || true
    
    echo "✅ Local cleanup completed"
}

# Function to display build summary
build_summary() {
    echo ""
    echo "📋 Build Summary:"
    echo "  Build ID: ${BUILD_ID}"
    echo "  Frontend Image: ${FRONTEND_TAG_VERSIONED}"
    echo "  Backend Image: ${BACKEND_TAG_VERSIONED}"
    echo ""
    echo "🚀 Images are ready for deployment!"
    echo ""
    echo "📝 Next steps:"
    echo "  1. Run deployment script with BUILD_ID=${BUILD_ID}"
    echo "  2. Deploy to production using: ./scripts/deploy-production.sh"
    echo ""
}

# Main build process
main() {
    echo "🎯 Starting production build process..."
    
    # Pre-flight checks
    check_docker
    configure_docker_gcr
    
    # Build phase
    echo "🔄 Phase 1: Building images"
    build_frontend
    build_backend
    
    # Push phase
    echo "🔄 Phase 2: Pushing to registry"
    push_images
    
    # Verification phase
    echo "🔄 Phase 3: Verification"
    verify_images
    
    # Security scanning (optional)
    echo "🔄 Phase 4: Security scanning"
    security_scan
    
    # Cleanup (optional)
    if [ "${CLEANUP_LOCAL:-true}" = "true" ]; then
        echo "🔄 Phase 5: Cleanup"
        cleanup_local
    fi
    
    # Summary
    build_summary
    
    # Export build ID for use in deployment
    echo "export BUILD_ID=${BUILD_ID}" > .build-env
    echo "✅ Build ID exported to .build-env file"
}

# Pre-flight check: ensure we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "Dockerfile" ]; then
    echo "❌ This script must be run from the project root directory"
    exit 1
fi

# Run main build process
main "$@"