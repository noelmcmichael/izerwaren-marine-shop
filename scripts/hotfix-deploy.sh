#!/bin/bash

# Hotfix deployment script for static assets issue
# Builds and deploys without full CI/CD pipeline

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PROJECT_ID="noelmc"
REGION="us-central1"
SERVICE_NAME="izerwaren-revamp-2-0-web"
IMAGE_NAME="izerwaren-revamp-2-0"
BUILD_ID=$(date +%m%d-%H%M)-$(git rev-parse --short HEAD)

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Build Docker image locally
build_and_push_image() {
    print_status "Building Docker image with corrected static assets configuration..."
    
    # Build image with correct tag
    docker build --platform linux/amd64 -t "us-central1-docker.pkg.dev/$PROJECT_ID/$IMAGE_NAME/$IMAGE_NAME:$BUILD_ID" .
    
    if [ $? -eq 0 ]; then
        print_success "Docker image built successfully"
    else
        print_error "Docker build failed"
        exit 1
    fi
    
    # Push to Artifact Registry
    print_status "Pushing image to Artifact Registry..."
    docker push "us-central1-docker.pkg.dev/$PROJECT_ID/$IMAGE_NAME/$IMAGE_NAME:$BUILD_ID"
    
    if [ $? -eq 0 ]; then
        print_success "Image pushed successfully"
    else
        print_error "Image push failed"
        exit 1
    fi
}

# Deploy to Cloud Run
deploy_to_cloud_run() {
    print_status "Deploying to Cloud Run..."
    
    gcloud run deploy "$SERVICE_NAME" \
        --image="us-central1-docker.pkg.dev/$PROJECT_ID/$IMAGE_NAME/$IMAGE_NAME:$BUILD_ID" \
        --region="$REGION" \
        --project="$PROJECT_ID" \
        --platform=managed \
        --allow-unauthenticated \
        --service-account="izerwaren-revamp-2-0-run@$PROJECT_ID.iam.gserviceaccount.com" \
        --vpc-connector="izerwaren-revamp-2-0-vpc" \
        --memory=2Gi \
        --cpu=2 \
        --min-instances=1 \
        --max-instances=10 \
        --port=3000 \
        --timeout=300
    
    if [ $? -eq 0 ]; then
        print_success "Deployment completed successfully"
    else
        print_error "Deployment failed"
        exit 1
    fi
}

# Test the deployment
test_deployment() {
    print_status "Testing the deployment..."
    
    local service_url="https://$SERVICE_NAME-ek4ht2g44a-uc.a.run.app"
    
    # Test health endpoint
    print_status "Testing health endpoint..."
    local health_response
    health_response=$(curl -s --connect-timeout 10 "$service_url/api/health" || echo "error")
    
    if [ "$health_response" != "error" ]; then
        print_success "Health endpoint is responding"
    else
        print_warning "Health endpoint test failed"
    fi
    
    # Test static asset
    print_status "Testing CSS file access..."
    local css_response
    css_response=$(curl -s --connect-timeout 10 -I "$service_url/_next/static/css/b08691463249bfda.css" | head -1)
    
    if echo "$css_response" | grep -q "200 OK"; then
        print_success "CSS files are now serving correctly!"
    else
        print_warning "CSS files may still need configuration"
        echo "Response: $css_response"
    fi
    
    # Test domain
    print_status "Testing custom domain..."
    local domain_response
    domain_response=$(curl -s --connect-timeout 10 -I "https://izerwaren.mcmichaelbuild.com/" | head -1)
    
    if echo "$domain_response" | grep -q "200 OK"; then
        print_success "Custom domain is working!"
    else
        print_warning "Custom domain may need time to propagate"
    fi
}

# Main execution
main() {
    print_status "Starting hotfix deployment for static assets issue..."
    echo ""
    
    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    
    # Build and push image
    build_and_push_image
    echo ""
    
    # Deploy to Cloud Run
    deploy_to_cloud_run
    echo ""
    
    # Test deployment
    test_deployment
    echo ""
    
    print_success "Hotfix deployment completed!"
    print_status "Check https://izerwaren.mcmichaelbuild.com to verify styling is working"
}

# Run main function
main "$@"